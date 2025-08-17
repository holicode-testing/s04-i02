# Work Specification: [Project Name]

**Status:** [draft | active | completed]  
**Created:** {{ISO_DATE}}  
**Last Updated:** {{ISO_DATE}}  
**Total Context Size:** <2KB (optimized for AI context loading)

## Project Overview
[Brief one-line description of the project and its primary goal]

## Features
<!-- Feature chunks (<1KB each) - Single Discovery Entry Point -->
<!-- Example: - [FEATURE-auth](./features/FEATURE-auth.md) - User authentication system -->

## Active Stories  
<!-- Story chunks (<1KB each) linked to parent features -->
<!-- Example: - [STORY-login](./stories/STORY-login.md) - User login workflow (Feature: FEATURE-auth) -->

## Current Tasks
<!-- Task chunks (<1KB each) with dependency tracking -->
<!-- Example: - [TASK-login-ui](./tasks/TASK-login-ui.md) - Build login form (Story: STORY-login, Type: functional) -->

## Technical Design Documents
<!-- Links to TD documents processed by implementation-plan workflow -->
### Processed TDs
<!-- Track which TDs have been converted to tasks to prevent duplicates -->
<!-- Example: - TD-001: System Architecture - ✅ Tasks generated -->
<!-- Example: - TD-002: Infrastructure & Deployment - ⏳ Pending task generation -->

### Unprocessed TDs
<!-- TDs waiting for task generation -->

## Implementation Status
<!-- Component references as they are implemented -->
### Completed Components
<!-- Example: - `Auth` → [SPEC.md](../src/components/Auth/SPEC.md) - Authentication service (✅ Complete) -->

### In Progress Components
<!-- Example: - `UserProfile` → [SPEC.md](../src/components/UserProfile/SPEC.md) - User profile management (🔄 In Progress) -->

### Planned Components
<!-- Components identified but not yet implemented -->

## Hierarchy Map
<!-- Visual representation of chunk relationships for quick navigation -->
```
├── FEATURE-[id] (Business Value)
│   ├── STORY-[id] (User Requirements)  
│   │   └── TASK-[id] (Implementation Work)
│   │       └── Component SPECs (Live Implementation Specs)
└── Technical Design (TD-XXX)
    └── Architectural Tasks (Implementation Work)
```

## Context Optimization Notes
- **Chunked Architecture**: Each specification chunk <1KB for optimal AI context loading
- **Single Discovery**: This manifest serves as the single entry point for all specifications
- **Hierarchical Linking**: Clear parent-child relationships between chunks
- **Live SPECs**: Implementation specifications co-located with code in src/**/SPEC.md

## Validation Status
- [ ] All chunks validate against .holicode/specs/SCHEMA.md
- [ ] Hierarchical links resolve correctly
- [ ] No orphaned specifications
- [ ] Component SPECs exist for all referenced components

---
*This manifest is maintained by HoliCode workflows and should not be manually edited.*
*Use spec-sync tool to validate consistency: `npm run spec-sync` (if configured)*
