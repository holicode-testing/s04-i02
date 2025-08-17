# Delegation Context: AI-Powered Learning Companion Platform

## Overview:
This document defines the decision delegation settings for the project, outlining which categories of decisions require human approval and which can be delegated to AI, based on project maturity and established protocols.

## Default Delegation Model:
By default, all significant decisions require human approval. AI delegation operates on an explicit opt-out model, meaning delegation must be consciously enabled and documented here.

## Decision Categories and Delegation Status:

### Business Decisions:
- **Default Status**: `require_human_approval`
- **Delegated to AI**: `false`
- **Maturity Indicator**: `low` (exploratory phase, frequent human input needed)
- **Examples**: Feature scope, epic decomposition, success metric targets, user story prioritization.

### Technical Decisions:
- **Default Status**: `require_human_approval`
- **Delegated to AI**: `false`
- **Maturity Indicator**: `low` (exploratory phase, frequent human input needed)
- **Examples**: Technology stack selection, architecture patterns, security approach, performance trade-offs, database design.

## Maturity Indicators:
- `low`: Project/area is in an exploratory or early phase, requiring significant human oversight and decision-making.
- `medium`: Project/area has established patterns and processes, allowing for some AI-assisted decision-making within defined boundaries.
- `high`: Project/area is mature and stable, enabling a higher degree of AI delegation for routine decisions.

## Delegation Check Protocol:
Workflows will consult this document to determine if human approval is required for a given decision. If `delegated_to_ai` is `false`, the system will use `ask_followup_question` to seek human approval.

## Security & Reliability Gates:
All technical designs must include explicit security and reliability review regardless of delegation settings. These are mandatory human-reviewed gates.
