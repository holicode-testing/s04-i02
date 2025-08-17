:::: task TASK-F-004
**Story:** ../stories/STORY-AI-SUMMARIZATION-002.md
**Feature:** ../features/FEATURE-AI-SUMMARIZATION-001.md
**Status:** todo
**Priority:** medium
**Created:** 2025-08-17

## Task: Enhance Summarization Endpoint with Length and Format Options

**Type:** functional
**Source:** STORY-AI-SUMMARIZATION-002 (AC1)
**Complexity:** 3 (medium)
**Coupling Policy:** sequential
**Blocks:** TASK-F-005, TASK-F-006
**Depends On:** TASK-F-001

## Description
Modify the existing `/summarize` API endpoint in the NestJS `api` application to accept optional parameters for desired summary length (e.g., `short`, `medium`, `long`) and format (e.g., `bullet_points`, `paragraph`). These preferences should be passed to the LLM client module during the summarization request to influence the generated output.

## Acceptance Criteria
- [ ] The `/summarize` endpoint accepts new optional query parameters or request body fields for `length` and `format`.
- [ ] The `length` parameter supports values like "short", "medium", "long".
- [ ] The `format` parameter supports values like "bullet_points", "paragraph".
- [ ] The LLM client module correctly receives and utilizes these length and format preferences when making calls to the LLM.
- [ ] The LLM's response is observed to reflect these preferences when tested.

## Validation Steps
1. Start the `api` application.
2. Send POST requests to the `/summarize` endpoint, including `length` and `format` parameters with various combinations.
3. Verify that the LLM client module correctly processes these parameters.
4. Manually inspect the generated summaries to confirm they align with the requested length and format.

## Components Involved
<!-- Add links to related component SPEC.md files -->
::::
