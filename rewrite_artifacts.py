import os
import re

mapping = {
    'software': {
        'requirement.md': 'softwarerequirement',
        'testcases.md': 'softwaretestcase'
    },
    'system': {
        'requirement.md': 'systemrequirement',
        'testcases.md': 'systemtestcase'
    },
    'risk.md': 'risk',
    'task.md': 'task',
    'release.md': 'release'
}

titles_map = {
    'requirement.md': 'Requirement Specification',
    'testcases.md': 'Test Case Specification',
    'risk.md': 'Risk Assessment',
    'task.md': 'Implementation Task Breakdown',
    'release.md': 'Release Definition'
}

base_dir = 'artifacts/219E-769'
for sub_dir in os.listdir(base_dir):
    full_sub_dir = os.path.join(base_dir, sub_dir)
    if not os.path.isdir(full_sub_dir):
        continue
    
    task_files = [f for f in os.listdir(full_sub_dir) if f.startswith('_task-') and f.endswith('.md')]
    if not task_files:
        continue
    
    task_file_path = os.path.join(full_sub_dir, task_files[0])
    with open(task_file_path, 'r') as f:
        content = f.read()
        task_id = re.search(r'^id:\s*(.*)', content, re.M).group(1).strip()
        subtype = re.search(r'^subtype:\s*(.*)', content, re.M).group(1).strip()
        task_title = re.search(r'^title:\s*(.*)', content, re.M).group(1).strip()

    for filename in ['requirement.md', 'testcases.md', 'risk.md', 'task.md', 'release.md']:
        file_path = os.path.join(full_sub_dir, filename)
        if not os.path.exists(file_path):
            continue
        
        if filename in ['requirement.md', 'testcases.md']:
            mapped_type = mapping[subtype][filename]
        else:
            mapped_type = mapping[filename]
        
        artifact_title = titles_map[filename]
        description = f"This document provides the {artifact_title.lower()} for the subtask: {task_title}. It ensures that all relevant details for {task_title} are properly documented and tracked as part of the project lifecycle."

        new_content = f"""---
type: {mapped_type}
parent_id: {task_id}
link_role: has_specification
id:
---

## {artifact_title}

{description}
"""
        with open(file_path, 'w') as f:
            f.write(new_content)
