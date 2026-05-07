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
      const linkedDetails = await Promise.all(
        linked.data
          .filter((l) => l.id?.includes("/verifies/"))
          .map((l) => {
            const linkedId = l.id.split("/").pop();
            return polarionGet(`/projects/${PROJECT}/workitems/${linkedId}?fields%5Bworkitems%5D=${FIELDS}`);
          })
      );
      if (linkedDetails.length) {
        text += "\n\n=== ACCEPTANCE CRITERIA ===\n";
        text += linkedDetails.map((d) => formatWorkitem(d.data)).join("\n\n---\n\n");
      }
    }

    return { content: [{ type: "text", text }] };
  }
);

server.tool(
  "update_workitem",
  "Update a Polarion workitem: change status and/or append a link (e.g. PR or commit URL) to description",
  {
    id: z.string().describe("Workitem ID e.g. 219E-42"),
    status: z.string().optional().describe("New status e.g. inProgress, done, verified"),
    link_url: z.string().optional().describe("PR or commit URL to append to description"),
    link_label: z.string().optional().describe("Label for the link e.g. 'PR #42' or 'Commit abc123'"),
  },
  async ({ id, status, link_url, link_label }) => {
    const attributes = {};

    if (status) {
      attributes.status = status;
    }

    if (link_url) {
      // Fetch current description first
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

    if (!Object.keys(attributes).length) {
      return { content: [{ type: "text", text: "Nothing to update — provide status or link_url." }] };
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

const transport = new StdioServerTransport();
await server.connect(transport);
