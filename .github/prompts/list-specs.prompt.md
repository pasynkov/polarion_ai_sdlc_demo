---
mode: agent
---

Always respond in English.

## Phase 1 — Show available specs

Call `list_wiki_pages("Requirements")` and show as a numbered list:
```
1. <Title>  (page: "<page_name>")
2. <Title>  (page: "<page_name>")
...
```

Ask: "Which specification would you like to analyze? Reply with the number or page name."

**Wait for the user's reply before proceeding.**

---

## Phase 2 — Full analysis (after user picks)

Resolve the user's reply to a page name (if number, map to page name from Phase 1 list).

### Step 1 — Fetch spec and create root task

1. Call `get_wiki_page("Requirements", "<page_name>")`. Save returned `URL` as `WIKI_URL`.
2. Call `create_workitem`:
   - `type`: `task`
   - `title`: `Analyze spec: <page_name>`
   - `description`: `Root task for requirements analysis of <page_name>`
   - `status`: `inProgress`
   Save returned ID as `ROOT_ID`.
3. Call `update_workitem(ROOT_ID, hyperlink_url: WIKI_URL)`.
4. Create file `artifacts/<ROOT_ID>/root.md`:
   ```markdown
   ---
   type: task
   id: <ROOT_ID>
   title: Analyze spec: <page_name>
   parent_page: <page_name>
   wiki_url: <WIKI_URL>
   ---

   ## Analyze spec: <page_name>

   Root task for requirements analysis of <page_name>.
   ```

### Step 2 — Decompose spec into subtasks

Identify the major functional domains of the spec. Group related requirements together — each subtask should cover a broad area, not a single feature. Aim for 3–5 subtasks maximum; merge anything that belongs to the same domain.

Each subtask is either:
- **software** — logic, firmware, interfaces, APIs
- **system** — hardware, mechanics, electrical, physical

### Step 3 — Create subtasks in Polarion (parallel)

Call `create_workitem` for ALL subtasks simultaneously. Every single subtask MUST have:
- `type`: `task`
- `title`: subtask title
- `description`: one paragraph description
- `parent_id`: `ROOT_ID`  ← required for every subtask, no exceptions
- `link_role`: `has_specification`

After ALL subtask creates complete: call `update_workitem(ROOT_ID, description: <subtask list>)` to append subtask IDs and titles to root description.

### Step 4 — Create local folders and task files ONLY

**Do NOT create artifact workitems. Do NOT call create_workitem again. Only create local files.**

Process subtasks one at a time. For each subtask:
1. Report: "Creating folder for: <SUBTASK_ID> — <Title>..."
2. Create the folder and file.
3. Report: "✓ <subtask-slug>/"

Then move to the next subtask.

For each subtask (using SUBTASK_ID returned in Step 3), create folder `artifacts/<ROOT_ID>/<subtask-slug>/` containing only one file:

**`_task-<SUBTASK_ID>.md`:**
```markdown
---
type: task
subtype: software | system
title: <Subtask title>
parent_id: <ROOT_ID>
id: <SUBTASK_ID>
link_role: has_specification
---

## <Subtask title>

<One paragraph description of what this subtask covers.>
```

### Step 5 — Report and stop

Output:
```
Root task: <ROOT_ID>
Wiki: <WIKI_URL>
Folder: artifacts/<ROOT_ID>/

Subtasks created:
  <SUBTASK_ID> — [software|system] <Title>
  ...
```

Then: "Review subtask descriptions in `artifacts/<ROOT_ID>/`, edit if needed, then run **/generate-artifacts**."

**Stop. Do not create any more files or call any more tools.**
