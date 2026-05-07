---
mode: agent
tools:
  - polarion_get_workitem
  - polarion_update_workitem
  - run_in_terminal
  - create_file
  - read_file
  - replace_string_in_file
---

Implement task **${input:workitem_id: Enter workitem ID (e.g. 219E-509)}**.

## Steps

1. Call `get_workitem` to load the task and Acceptance Criteria
2. Create a feature branch: `git checkout -b feature/${input:workitem_id}-<short-slug>`
3. Implement the solution — satisfy every Acceptance Criterion, nothing more
4. Verify: run the server, confirm it satisfies all AC (e.g. curl returns 200)
5. Commit with workitem ID in message: `git commit -m "feat: <description> ${input:workitem_id}"`
6. Push the branch: `git push -u origin HEAD`
7. Call `update_workitem` to set status → `inProgress`

After push, create a PR via `gh pr create` with `${input:workitem_id}` in the title.
