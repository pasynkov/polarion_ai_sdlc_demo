---
mode: agent
tools:
  - polarion_get_workitem
---

Fetch task **${input:workitem_id: Enter workitem ID (e.g. 219E-509)}** from Polarion using `get_workitem`.

Then create an implementation plan:

1. Re-state the task goal in one sentence
2. List the Acceptance Criteria that must pass
3. Write a step-by-step implementation plan (files to create, commands to run)
4. List any assumptions

**Stop and wait for user approval before writing any code.**
Reply with: "Ready to implement. Please confirm to proceed."
