---
mode: agent
---

Upload artifact files to Polarion.

Task ID (optional): **${input:task_id: Enter root task ID, or leave blank to auto-detect}**

Always respond in English.

## Steps

### Phase 1 — Locate folder

1. If `task_id` provided — use `artifacts/<task_id>/`. Otherwise list folders under `artifacts/`, pick the most recently modified one.
2. Read `root.md` → get `ROOT_ID`.
3. List all subfolders.

### Phase 2 — Upload all artifact files (parallel)

For each subfolder:
1. Extract `SUBTASK_ID` from the `_task-<SUBTASK_ID>.md` filename.
2. For each artifact file (`requirement.md`, `testcases.md`, `risk.md`, `task.md`, `release.md`):
   - **Skip files that already have `id:` filled in frontmatter.**
   - Read frontmatter: `type`, `parent_id`, `link_role` (already filled).
   - Read `## Title` → `title`, body text → `description`.
   - Call `create_workitem(type, title, description, parent_id, link_role)`.

Call ALL `create_workitem` requests simultaneously across all subfolders.

**Valid Polarion types:** `task`, `softwarerequirement`, `systemrequirement`, `softwaretestcase`, `systemtestcase`, `risk`, `release`

After all complete:
- Write returned `id` into each file's frontmatter `id:` field.
- Rename: `requirement.md` → `requirement-<ID>.md`.

### Phase 3 — Finalize

1. `update_workitem(ROOT_ID, status: done)`.
2. Print summary tree:
```
ROOT_ID — root task — <URL>
  SUBTASK_ID — <title> [software|system] — <URL>
    <type> — <title> — <ID> — <URL>
    ...
```
