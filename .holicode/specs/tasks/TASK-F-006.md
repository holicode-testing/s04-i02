:::: task TASK-F-006
**Story:** ../stories/STORY-AI-SUMMARIZATION-002.md
**Feature:** ../features/FEATURE-AI-SUMMARIZATION-001.md
**Status:** todo
**Priority:** medium
**Created:** 2025-08-17

## Task: Enhance Summarization UI with Length and Format Options

**Type:** functional
**Source:** STORY-AI-SUMMARIZATION-002 (AC1)
**Complexity:** 2 (simple)
**Coupling Policy:** sequential
**Blocks:** N/A
**Depends On:** TASK-F-003, TASK-F-004

## Description
Add UI elements (e.g., dropdowns, radio buttons, sliders) to the summarization interface in the React `web` application. These elements will allow users to select their desired summary length (e.g., "short", "medium", "long") and format (e.g., "bullet points", "paragraph"). The selected options should be passed to the `/summarize` API endpoint when a request is made.

## Acceptance Criteria
- [ ] The UI includes clear controls for selecting summary length.
- [ ] The UI includes clear controls for selecting summary format.
- [ ] User selections for length and format are correctly captured.
- [ ] When the summarization button is clicked, the selected length and format options are sent as parameters to the `/summarize` API endpoint.

## Validation Steps
1. Start both the `api` and `web` applications.
2. Navigate to the `web` application in a browser.
3. Select various length and format options.
4. Submit text for summarization and use browser developer tools to verify that the API request includes the chosen length and format parameters.
5. Confirm that the displayed summary reflects the chosen preferences (e.g., is presented in bullet points).

## Components Involved
<!-- Add links to related component SPEC.md files -->
::::
