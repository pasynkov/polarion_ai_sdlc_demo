---
mode: agent
---

Design task **${input:workitem_id: Enter workitem ID (e.g. 219E-509)}**.

## Steps

1. Call `get_workitem` to load task title, description, and Acceptance Criteria
2. Generate a technical specification:
   - **Goal**: one sentence
   - **Stack**: languages, frameworks, versions
   - **File structure**: list files to create with purpose
   - **Interfaces / API**: endpoints or function signatures
   - **How AC will be satisfied**: map each criterion to implementation detail
3. **Stop and present the spec to the user. Wait for approval.**
4. After approval — call `create_workitem` with:
   - `type`: `specification`
   - `title`: `Spec: <task title>`
   - `description`: the full spec as HTML
   - `parent_id`: the workitem ID
   - `link_role`: `has_specification`
5. Report the created specification ID and URL
