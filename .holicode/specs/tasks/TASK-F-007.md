:::: task TASK-F-007
**Story:** ../stories/STORY-AI-SUMMARIZATION-003.md
**Feature:** ../features/FEATURE-AI-SUMMARIZATION-001.md
**Status:** todo
**Priority:** medium
**Created:** 2025-08-17

## Task: Display Summary with Original Content Association in UI

**Type:** functional
**Source:** STORY-AI-SUMMARIZATION-003 (AC3)
**Complexity:** 2 (simple)
**Coupling Policy:** sequential
**Blocks:** N/A
**Depends On:** TASK-F-003

## Description
Modify the summarization UI in the React `web` application to clearly associate the generated summary with the original content it was derived from. This could be achieved by displaying a title, a snippet of the source text, or a clear visual link alongside the summary.

## Acceptance Criteria
- [ ] The generated summary is displayed on the UI.
- [ ] A clear visual or textual indicator associates the summary with its original source content.
- [ ] The association method is intuitive and easy for the user to understand.

## Validation Steps
1. Start both the `api` and `web` applications.
2. Navigate to the `web` application in a browser.
3. Submit text for summarization.
4. Verify that the displayed summary is accompanied by a clear reference to the original input text.

## Components Involved
<!-- Add links to related component SPEC.md files -->
::::
