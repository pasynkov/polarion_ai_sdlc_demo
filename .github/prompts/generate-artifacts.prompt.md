---
mode: agent
---

Generate local artifact files for each subtask. No Polarion API calls in this step.

Always respond in English.

## Steps

### Phase 1 — Locate root task and load context

1. List folders under `artifacts/`, find the most recently modified one.
2. Read its `root.md` — get `id` as `ROOT_ID`, `parent_page` as `PAGE_NAME`.
3. Call `get_wiki_page("Requirements", PAGE_NAME)` — save full spec text as `SPEC_CONTENT`.
4. List all subfolders under `artifacts/<ROOT_ID>/`.
5. Read ALL `_task-<SUBTASK_ID>.md` files simultaneously.

### Phase 2 — Generate artifact files subtask by subtask

Process subtasks one at a time. For each subtask:
1. Report: "Generating artifacts for: <SUBTASK_ID> — <Title>..."
2. Create all 5 artifact files for that subtask **simultaneously** (in parallel).
3. Report: "✓ Done: <subtask-slug>/"

Then move to the next subtask.

This way files appear on disk progressively as each subtask completes.

For each subtask:
- Get `SUBTASK_ID` from `_task-<SUBTASK_ID>.md` filename
- Get `subtype` (software or system) from its frontmatter
- Use BOTH `SPEC_CONTENT` and subtask description as context for generating content

Create these 5 files simultaneously within each subtask:

**Type mapping:**

| File | software type | system type |
|------|--------------|-------------|
| requirement.md | `softwarerequirement` | `systemrequirement` |
| testcases.md | `softwaretestcase` | `systemtestcase` |
| risk.md | `risk` | `risk` |
| task.md | `task` | `task` |
| release.md | `release` | `release` |

Each file format:
```markdown
---
type: <type from table>
parent_id: <SUBTASK_ID>
link_role: has_specification
id:
---

## <Meaningful artifact title>

<One paragraph. Derived from SPEC_CONTENT and subtask description. Specific and non-generic.>
```

**Do NOT call create_workitem or any Polarion API. Write local files only.**

### Phase 3 — Report

Output folder tree showing all created files, then:
"Review and edit artifact files as needed, then run **/upload-artifacts** to create workitems in Polarion."
