---
mode: agent
---

Fetch task **${input:workitem_id: Enter workitem ID (e.g. 219E-509)}** from Polarion.

Call `get_workitem` with the provided ID and display:
1. Task title and description
2. Current status
3. Acceptance Criteria (from linked testcases)

Format the output clearly so it can be used for planning.
