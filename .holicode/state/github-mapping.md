# GitHub Mapping: AI-Powered Learning Companion Platform

## Overview:
This document maps internal HoliCode entities (features, stories, tasks, components) to their corresponding GitHub issues, pull requests, and other relevant GitHub resources. It serves as a central reference for tracking work in GitHub and synchronizing state.

## Configuration:
- **GitHub Repository URL**: (To be filled upon project initialization with a GitHub remote)
- **Default Branch**: `main` (or `master`, depending on repository setup)
- **Issue Labels**:
    - `epic`: For large initiatives/epics.
    - `story`: For user stories.
    - `task`: For implementation tasks.
    - `bug`: For identified defects.
    - `enhancement`: For new features or improvements.
    - `documentation`: For documentation-related tasks.
- **Milestones**: (To be defined as project progresses, e.g., "Sprint 1", "MVP")
- **Projects**: (To be defined if GitHub Projects are used for broader task management)

## Mapped Entities:
(This section will be populated dynamically as issues and PRs are created and linked)

### Epics:
- Example:
    ```
    - title: "User Authentication & Authorization"
      holicode_id: "EPIC-AUTH-001"
      github_issue_number: 1
      github_issue_url: "https://github.com/your-org/your-repo/issues/1"
    ```

### Stories:
- Example:
    ```
    - title: "As a Learner, I can sign up for an account"
      holicode_id: "STORY-SIGNUP-001"
      github_issue_number: 2
      github_issue_url: "https://github.com/your-org/your-repo/issues/2"
      parent_epic_holicode_id: "EPIC-AUTH-001"
    ```

### Tasks:
- Example:
    ```
    - title: "Implement user registration API endpoint"
      holicode_id: "TASK-REG-API-001"
      github_issue_number: 3
      github_issue_url: "https://github.com/your-org/your-repo/issues/3"
      parent_story_holicode_id: "STORY-SIGNUP-001"
