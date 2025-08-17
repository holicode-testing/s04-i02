:::: task TASK-006
**Story:** N/A (Architectural)
**Feature:** ../features/FEATURE-AI-SUMMARIZATION-001.md
**Status:** todo
**Priority:** high
**Created:** 2025-08-17

## Task: Implement Basic API Key Authentication for `api` endpoint

**Type:** architectural
**Source:** TD-005 (API key authentication for MVP)
**Complexity:** 2 (simple)
**Coupling Policy:** sequential
**Blocks:** TASK-F-003, TASK-F-006
**Depends On:** TASK-004

## Description
Add a simple API key or token-based authentication mechanism to the NestJS `api` application to secure its endpoints. This mechanism should validate a key provided in the request (e.g., in a header) against a configured secret.

## Acceptance Criteria
- [ ] An authentication guard or middleware is implemented in the `api` application.
- [ ] The API key is read from a secure source (e.g., environment variable).
- [ ] Requests without a valid API key are rejected with an appropriate HTTP status code (e.g., 401 Unauthorized).
- [ ] Requests with a valid API key are successfully processed.

## Validation Steps
1. Configure a sample API key in the `.env` file for the `api` application.
2. Attempt to access a protected API endpoint without providing the API key; verify it is rejected.
3. Attempt to access a protected API endpoint with an invalid API key; verify it is rejected.
4. Attempt to access a protected API endpoint with a valid API key; verify it is successfully processed.

## Components Involved
<!-- Add links to related component SPEC.md files -->
::::
