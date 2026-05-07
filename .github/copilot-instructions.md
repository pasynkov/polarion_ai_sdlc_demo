# AI SDLC Demo — Copilot Instructions

## Workflow

### 1. Take a task
Use `polarion` MCP tool to get workitem details:
```
get_workitem("219E-509")
```
Read title, description, and Acceptance Criteria before writing any code.

### 2. Create a branch
Branch name must contain the workitem ID:
```
git checkout -b feature/219E-509-<short-description>
```

### 3. Implement
Implement exactly what Acceptance Criteria requires. Nothing more.

### 4. Commit
Commit message must contain the workitem ID so Polarion links it automatically:
```
git commit -m "feat: <description> 219E-509"
```

### 5. Push and open PR
```
git push -u origin feature/219E-509-<short-description>
```
PR title must contain the workitem ID: `feat: NestJS server 219E-509`

GitHub Actions will automatically:
- Set workitem status → `inProgress` + attach PR link
- After merge → set status → `done` + attach commit link

### 6. Verify in Polarion
Workitem `219E-509`:
- Linked Revisions tab — commit visible
- Status changed to `done`
- PR link in description
