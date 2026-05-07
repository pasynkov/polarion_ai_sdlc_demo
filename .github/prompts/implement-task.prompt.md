---
mode: agent
---

Implement task **${input:workitem_id: Enter workitem ID (e.g. 219E-513)}**.

## Steps

1. Call `get_workitem` to load task, Acceptance Criteria, and linked specification
2. If no specification found — stop and ask user to run `/design-task` first
3. Create feature branch: `git checkout -b feature/${input:workitem_id}-<short-slug>`
4. Implement strictly according to the specification — no extras
5. **Write e2e/unit tests that cover every Acceptance Criterion** — one test per AC item
6. Run tests — all must pass before committing
7. Verify AC manually (e.g. `curl` calls matching the AC scenarios)
8. Commit with workitem ID: `git commit -m "feat: <description> ${input:workitem_id}"`
9. Push: `git push -u origin HEAD`
10. Create PR via `gh pr create --title "feat: <description> ${input:workitem_id}" --body "Closes ${input:workitem_id}"`
11. Call `update_workitem` — set status `inProgress`
