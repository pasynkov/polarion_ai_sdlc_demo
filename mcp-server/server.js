import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const PAT = process.env.PALARION_PAT;
const PROJECT = process.env.POLARION_PROJECT_ID;
const BASE = "https://testdrive.polarion.com/polarion/rest/v1";

if (!PAT || !PROJECT) {
  console.error("PALARION_PAT and POLARION_PROJECT_ID env vars required");
  process.exit(1);
}

function headers() {
  return {
    Authorization: `Bearer ${PAT}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  };
}

async function polarionGet(path) {
  const res = await fetch(`${BASE}${path}`, { headers: headers() });
  if (!res.ok) throw new Error(`Polarion API ${res.status}: ${await res.text()}`);
  return res.json();
}

async function polarionPatch(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: "PATCH",
    headers: headers(),
    body: JSON.stringify(body),
  });
  if (res.status !== 204) throw new Error(`Polarion PATCH ${res.status}: ${await res.text()}`);
}

const FIELDS = "id,title,description,status,type,priority";

function formatWorkitem(data) {
  const a = data.attributes || {};
  return [
    `ID: ${a.id}`,
    `Type: ${a.type}`,
    `Status: ${a.status}`,
    `Title: ${a.title}`,
    a.priority ? `Priority: ${a.priority}` : null,
    a.description?.value ? `\nDescription:\n${a.description.value.replace(/<[^>]+>/g, "")}` : null,
    `\nURL: ${data.links?.portal}`,
  ]
    .filter(Boolean)
    .join("\n");
}

const server = new McpServer({
  name: "polarion",
  version: "1.0.0",
});

server.tool(
  "search_workitems",
  "Search workitems in Polarion project by text query and/or type",
  {
    query: z.string().optional().describe("Text to search in title/description"),
    type: z.string().optional().describe("Workitem type e.g. task, requirement, testcase"),
    status: z.string().optional().describe("Filter by status e.g. open, inProgress, done"),
  },
  async ({ query, type, status }) => {
    const filters = [];
    if (type) filters.push(`type:("${type}")`);
    if (status) filters.push(`status:("${status}")`);
    if (query) filters.push(query);

    const filterParam = filters.length
      ? `&filter%5Bworkitems%5D=${encodeURIComponent(filters.join(" AND "))}`
      : "";

    const data = await polarionGet(
      `/projects/${PROJECT}/workitems?fields%5Bworkitems%5D=${FIELDS}&page%5Bsize%5D=20${filterParam}`
    );

    if (!data.data?.length) return { content: [{ type: "text", text: "No workitems found." }] };

    const items = data.data.map((item) => formatWorkitem(item)).join("\n\n---\n\n");
    const total = data.meta?.totalCount ?? "?";
    return {
      content: [{ type: "text", text: `Found ${total} total, showing ${data.data.length}:\n\n${items}` }],
    };
  }
);

server.tool(
  "get_workitem",
  "Get full details of a Polarion workitem by ID including linked testcases (Acceptance Criteria)",
  {
    id: z.string().describe("Workitem ID e.g. 219E-42"),
  },
  async ({ id }) => {
    const [data, linked] = await Promise.all([
      polarionGet(`/projects/${PROJECT}/workitems/${id}?fields%5Bworkitems%5D=${FIELDS}`),
      polarionGet(`/projects/${PROJECT}/workitems/${id}/linkedworkitems`).catch(() => null),
    ]);

    let text = formatWorkitem(data.data);

    if (linked?.data?.length) {
      // ID format: projectId/wiId/role/projectId/linkedWiId
      const fetch2 = (l) => {
        const linkedId = l.id.split("/").pop();
        return polarionGet(`/projects/${PROJECT}/workitems/${linkedId}?fields%5Bworkitems%5D=${FIELDS}`);
      };

      const acItems = linked.data.filter((l) => l.id?.includes("/verifies/"));
      const specItems = linked.data.filter((l) => l.id?.includes("/has_specification/"));

      if (acItems.length) {
        const details = await Promise.all(acItems.map(fetch2));
        text += "\n\n=== ACCEPTANCE CRITERIA ===\n";
        text += details.map((d) => formatWorkitem(d.data)).join("\n\n---\n\n");
      }
      if (specItems.length) {
        const details = await Promise.all(specItems.map(fetch2));
        text += "\n\n=== SPECIFICATION ===\n";
        text += details.map((d) => formatWorkitem(d.data)).join("\n\n---\n\n");
      }
    }

    return { content: [{ type: "text", text }] };
  }
);

server.tool(
  "update_workitem",
  "Update a Polarion workitem: change status, append a link to description, or add a hyperlink to the Links tab",
  {
    id: z.string().describe("Workitem ID e.g. 219E-42"),
    status: z.string().optional().describe("New status e.g. inProgress, done, verified"),
    link_url: z.string().optional().describe("PR or commit URL to append to description"),
    link_label: z.string().optional().describe("Label for the link e.g. 'PR #42' or 'Commit abc123'"),
    hyperlink_url: z.string().optional().describe("URL to add to the workitem's Links tab (ref_ext role)"),
  },
  async ({ id, status, link_url, link_label, hyperlink_url }) => {
    const attributes = {};

    if (status) {
      attributes.status = status;
    }

    if (link_url) {
      const current = await polarionGet(
        `/projects/${PROJECT}/workitems/${id}?fields%5Bworkitems%5D=description`
      );
      const currentHtml = current.data.attributes?.description?.value || "";
      const label = link_label || link_url;
      const appendHtml = `<p><strong>Artifact:</strong> <a href="${link_url}">${label}</a></p>`;
      attributes.description = {
        type: "text/html",
        value: currentHtml + appendHtml,
      };
    }

    if (hyperlink_url) {
      attributes.hyperlinks = [{ role: "ref_ext", uri: hyperlink_url }];
    }

    if (!Object.keys(attributes).length) {
      return { content: [{ type: "text", text: "Nothing to update — provide status, link_url, or hyperlink_url." }] };
    }

    await polarionPatch(`/projects/${PROJECT}/workitems/${id}`, {
      data: {
        type: "workitems",
        id: `${PROJECT}/${id}`,
        attributes,
      },
    });

    return { content: [{ type: "text", text: `Updated ${id} successfully.` }] };
  }
);

server.tool(
  "create_workitem",
  "Create a new workitem in Polarion and optionally link it to a parent workitem",
  {
    type: z.string().describe("Workitem type: task, requirement, testcase, systemrequirement, softwarerequirement, systemtestcase, softwaretestcase, risk, release, specification"),
    title: z.string().describe("Title of the workitem"),
    description: z.string().describe("HTML or plain text description"),
    parent_id: z.string().optional().describe("Parent workitem ID to link to (e.g. 219E-509)"),
    link_role: z.string().optional().describe("Link role e.g. 'has_specification', 'verifies'. Default: has_specification"),
    status: z.string().optional().describe("Initial status e.g. open, draft, inProgress. Default: open"),
  },
  async ({ type, title, description, parent_id, link_role, status }) => {
    const res = await fetch(`${BASE}/projects/${PROJECT}/workitems`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        data: [{
          type: "workitems",
          attributes: {
            type,
            title,
            description: { type: "text/html", value: description },
            status: status || "open",
          },
        }],
      }),
    });
    if (!res.ok) throw new Error(`Create failed ${res.status}: ${await res.text()}`);
    const data = await res.json();
    const newId = data.data[0].id.split("/").pop();
    const url = data.data[0].links.portal;

    if (parent_id) {
      const role = link_role || "has_specification";
      // Link FROM newId TO parent_id to avoid race condition when parallel-creating siblings
      await fetch(`${BASE}/projects/${PROJECT}/workitems/${newId}/linkedworkitems`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          data: [{
            type: "linkedworkitems",
            attributes: { role },
            relationships: {
              workItem: { data: { type: "workitems", id: `${PROJECT}/${parent_id}` } },
            },
          }],
        }),
      });
    }

    return {
      content: [{
        type: "text",
        text: `Created ${newId}${parent_id ? ` linked to ${parent_id}` : ""}.\nURL: ${url}`,
      }],
    };
  }
);

server.tool(
  "list_wiki_pages",
  "List all wiki pages (documents) in a Polarion space",
  {
    space: z.string().describe("Space/folder name e.g. 'Requirements'"),
  },
  async ({ space }) => {
    const data = await polarionGet(
      `/projects/${PROJECT}/spaces/${space}/documents?fields%5Bdocuments%5D=id,title,name`
    );

    if (!data.data?.length) return { content: [{ type: "text", text: "No documents found." }] };

    const lines = data.data.map((d) => {
      const a = d.attributes || {};
      const name = d.id?.split("/").pop() || "";
      return `- ${a.title || name}  →  page: "${name}"`;
    });

    return { content: [{ type: "text", text: lines.join("\n") }] };
  }
);

server.tool(
  "get_wiki_page",
  "Get content of a Polarion wiki page (document) by space and page name",
  {
    space: z.string().describe("Space/folder name e.g. 'Requirements'"),
    page: z.string().describe("Page/document name e.g. 'Template_Customer_Requirements_Specification'"),
  },
  async ({ space, page }) => {
    const fields = "id,title,homePageContent,outlineNumbering";
    const data = await polarionGet(
      `/projects/${PROJECT}/spaces/${space}/documents/${page}?fields%5Bdocuments%5D=${fields}`
    );

    const a = data.data?.attributes || {};
    const content = a.homePageContent?.value || "";
    const plain = content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

    const url = `https://testdrive.polarion.com/polarion/redirect/project/${PROJECT}/wiki?spaceId=${space}&documentId=${page}`;
    const text = [`Title: ${a.title || page}`, `URL: ${url}`, "", plain]
      .filter((l) => l !== null)
      .join("\n");

    return { content: [{ type: "text", text }] };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
