:::: task TASK-F-002
**Story:** ../stories/STORY-AI-SUMMARIZATION-001.md
**Feature:** ../features/FEATURE-AI-SUMMARIZATION-001.md
**Status:** todo
**Priority:** medium
**Created:** 2025-08-17

## Task: Implement Content Length Validation in `api` application

**Type:** functional
**Source:** STORY-AI-SUMMARIZATION-001 (AC3)
**Complexity:** 2 (simple)
**Coupling Policy:** sequential
**Blocks:** N/A
**Depends On:** TASK-F-001

## Description
Add logic to the summarization endpoint (`/summarize`) in the NestJS `api` application to validate the length of the input text. If the content exceeds a predefined limit (e.g., maximum tokens for the LLM), return an appropriate error message to the client, informing them that the content is too long and suggesting a shorter version.

## Acceptance Criteria
- [ ] The system checks the length of the submitted text before sending it to the LLM.
- [ ] If the input text length exceeds a configured maximum, the system returns an HTTP 400 Bad Request or similar error.
- [ ] The error response body contains a clear message indicating that the content is too long and suggests trying a shorter version.
- [ ] Valid input text (within limits) is processed normally.

## Validation Steps
1. Start the `api` application.
2. Send a POST request to the `/summarize` endpoint with text content that is significantly longer than the expected limit.
3. Verify that the API returns an error response with the correct status code and message.
4. Send a POST request with text content within the expected limit and verify it processes successfully.

## Components Involved
<!-- Add links to related component SPEC.md files -->
::::
