---
mode: agent
---

Implement task **${input:workitem_id: Enter workitem ID (e.g. 219E-509)}**.

## Steps

1. Call `get_workitem` to load task, Acceptance Criteria, and linked specification
2. If no specification found — stop and ask user to run `/design-task` first
3. Create feature branch: `git checkout -b feature/${input:workitem_id}-<short-slug>`
4. Implement strictly according to the specification — no extras
5. Verify each Acceptance Criterion (e.g. `curl -s -o /dev/null -w "%{http_code}" http://localhost:8080` returns 200)
6. Commit with workitem ID: `git commit -m "feat: <description> ${input:workitem_id}"`
7. Push: `git push -u origin HEAD`
8. Create PR via `gh pr create --title "feat: <description> ${input:workitem_id}" --body "Closes ${input:workitem_id}"`
9. Call `update_workitem` — set status `inProgress`
