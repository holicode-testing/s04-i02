:::: task TASK-F-005
**Story:** ../stories/STORY-AI-SUMMARIZATION-002.md
**Feature:** ../features/FEATURE-AI-SUMMARIZATION-001.md
**Status:** todo
**Priority:** medium
**Created:** 2025-08-17

## Task: Implement Unfeasible Request Handling in `api` application

**Type:** functional
**Source:** STORY-AI-SUMMARIZATION-002 (AC3)
**Complexity:** 3 (medium)
**Coupling Policy:** sequential
**Blocks:** N/A
**Depends On:** TASK-F-004

## Description
Add logic to the summarization endpoint (`/summarize`) in the NestJS `api` application to detect if the requested summary length or format is unfeasible for the given input text (e.g., requesting a "long" summary for a single sentence). If unfeasible, the system should produce the closest possible summary to the user's preference and return an informative message explaining that the request could not be perfectly met.

## Acceptance Criteria
- [ ] The API endpoint intelligently assesses the feasibility of the requested `length` and `format` based on the input text.
- [ ] If the request is deemed unfeasible, the system still attempts to generate the closest possible summary.
- [ ] The API response includes a flag or message indicating that the request could not be perfectly fulfilled.
- [ ] The message provides a clear, user-friendly explanation of why the request was not perfectly met.

## Validation Steps
1. Start the `api` application.
2. Send POST requests to the `/summarize` endpoint with various input texts and unfeasible `length`/`format` combinations (e.g., very short text with "long" length).
3. Verify that the API returns a summary that is the closest possible match, along with an explanatory message.
4. Test with feasible combinations to ensure they are processed without the "unfeasible" flag.

## Components Involved
<!-- Add links to related component SPEC.md files -->
::::
