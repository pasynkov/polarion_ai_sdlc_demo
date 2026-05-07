---
mode: agent
---

Implement task **${input:workitem_id: Enter workitem ID (e.g. 219E-513)}**.

## Steps

1. Call `get_workitem` to load task, Acceptance Criteria, and linked specification
2. If no specification found — stop and ask user to run `/design-task` first
3. Call `update_workitem` on the specification workitem — set status `done`
4. Create feature branch: `git checkout -b feature/${input:workitem_id}-<short-slug>`
5. Implement strictly according to the specification — no extras
6. **Write e2e/unit tests that cover every Acceptance Criterion** — one test per AC item
7. Run tests — all must pass before committing
8. Verify AC manually (e.g. `curl` calls matching the AC scenarios)
9. Commit with workitem ID: `git commit -m "feat: <description> ${input:workitem_id}"`
10. Push: `git push -u origin HEAD`
11. Create PR via `gh pr create --title "feat: <description> ${input:workitem_id}" --body "Closes ${input:workitem_id}"`
12. Call `update_workitem` on the task — set status `inProgress`
