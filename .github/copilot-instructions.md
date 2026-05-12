# AI SDLC Demo — Copilot Instructions

Always respond in English.

## Flow overview

1. `/list-specs` — pick a spec → creates root task + subtasks in Polarion + local `_task-<ID>.md` files
2. Edit files in `artifacts/<ROOT_ID>/`
3. `/generate-artifacts` — generates local artifact stub files (requirement, testcases, risk, task, release) — no Polarion API
4. Edit artifact files
5. `/upload-artifacts` — uploads artifact files to Polarion, writes IDs back

---

## Prompt 1: List and analyze spec (`/list-specs`)

**Phase 1:** call `list_wiki_pages("Requirements")`, show numbered list, ask user to pick. Wait for reply.

**Phase 2 — after user picks, execute without stopping:**
1. Resolve number → page name if needed.
2. `get_wiki_page("Requirements", "<page_name>")` → save `URL` as `WIKI_URL`.
3. `create_workitem(type: task, status: inProgress)` → `ROOT_ID`.
4. `update_workitem(ROOT_ID, hyperlink_url: WIKI_URL)` — mandatory.
5. Create `artifacts/<ROOT_ID>/root.md`.
6. Decompose spec into 3–5 major functional domains (merge related requirements). Each subtask covers a broad area, not a single feature. Type: software or system.
7. **Parallel:** `create_workitem` for ALL subtasks — every one MUST have `parent_id: ROOT_ID`, `link_role: has_specification`.
8. `update_workitem(ROOT_ID)` — append subtask list to description.
9. Create `artifacts/<ROOT_ID>/<slug>/_task-<SUBTASK_ID>.md` for each subtask. **No artifact files. No more API calls.**
10. Report IDs and folder. Tell user to run `/generate-artifacts`.

---

## Prompt 2: Generate artifacts (`/generate-artifacts`)

**Local file generation only — no Polarion API calls.**

1. Auto-detect `ROOT_ID` from most recently modified `artifacts/` folder.
2. Re-read spec via `get_wiki_page` → save as `SPEC_CONTENT`.
3. Read ALL `_task-<SUBTASK_ID>.md` files simultaneously.
4. **Parallel:** for ALL subtasks at once, create all 5 artifact files using both `SPEC_CONTENT` and subtask description as context. `parent_id: SUBTASK_ID` pre-filled, `id:` blank.
5. Tell user to review/edit, then run `/upload-artifacts`.

Type mapping (by subtask subtype):
| File | software | system |
|------|----------|--------|
| requirement.md | `softwarerequirement` | `systemrequirement` |
| testcases.md | `softwaretestcase` | `systemtestcase` |
| risk.md | `risk` | `risk` |
| task.md | `task` | `task` |
| release.md | `release` | `release` |

---

## Prompt 3: Upload artifacts (`/upload-artifacts`)

1. Auto-detect folder or use provided `task_id`.
2. For each subfolder: extract `SUBTASK_ID` from `_task-<SUBTASK_ID>.md` filename.
3. **Parallel:** `create_workitem` for all artifact files across all subfolders simultaneously.
   - Skip files with `id:` already filled.
   - `parent_id`, `type`, `link_role` read from frontmatter.
   - After done: write `id` into frontmatter, rename `requirement.md` → `requirement-<ID>.md`.
4. `update_workitem(ROOT_ID, status: done)`.
5. Print summary tree with all IDs and URLs.
