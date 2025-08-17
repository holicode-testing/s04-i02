<!--
workflow_type: maintenance
recommended_model: medium
memory_files_updated: ["all"]
description: "Comprehensive state update following documentation loop"
-->

# HoliCode State Update - Documentation Review Loop

Systematic review and update of all state files following the documentation update pattern with atomic batch updates.

## Atomic State Update Architecture
This workflow implements atomic, ordered batch updates to ensure consistency:
1. **Write Order**: activeContext.md → retro-inbox.md → progress.md (ALWAYS in this order)
2. **Update Strategy**: Prefer section-anchored replace_in_file blocks
3. **Validation**: Verify all updates applied correctly before proceeding

## Trigger Detection
<ask_followup_question>
<question>What triggered this state update?
- User requested "update state"
- Significant milestone completed  
- Major architectural change
- Regular maintenance cycle
- Context reset preparation
</question>
</ask_followup_question>

## Review ALL State Files
Following the systematic review process:

### Step 1: Review ALL Files
<read_file>
<path>.holicode/state/projectbrief.md</path>
</read_file>

<read_file>
<path>.holicode/state/productContext.md</path>
</read_file>

<read_file>
<path>.holicode/state/systemPatterns.md</path>
</read_file>

<read_file>
<path>.holicode/state/techContext.md</path>
</read_file>

<read_file>
<path>.holicode/state/activeContext.md</path>
</read_file>

<read_file>
<path>.holicode/state/progress.md</path>
</read_file>

### Step 2: Document Current State
Based on review, current state summary:
- **Recent developments**: [What has changed since last update]
- **Current focus**: [What is the immediate priority]
- **Completion status**: [What's done, in progress, planned]
- **Key decisions**: [Recent architectural or strategic decisions]

### Step 3: Clarify Next Steps
- **Immediate next steps** (next 1-2 iterations)
- **Medium-term objectives** (after 2 iterations)
- **Dependencies and blockers** 
- **Resource requirements**

### Step 4: Update .clinerules if Needed
<ask_followup_question>
<question>Should I update .clinerules or retro.md with any new patterns or insights discovered during this review?</question>
</ask_followup_question>

## Update Metadata and Content (Atomic Batch Pattern)

### Step 1: Prepare All Updates
Prepare all state file updates in memory before applying:
- activeContext.md changes
- retro-inbox.md observations
- progress.md metrics (ALWAYS LAST)

### Step 2: Apply Updates in Strict Order

#### Update activeContext.md (First)
<replace_in_file>
<path>.holicode/state/activeContext.md</path>
<diff>
[Section-anchored updates using small, precise blocks]

## Git Commit Changes
Create a semantic commit for state updates using standardized workflow:

```bash
# Call git-commit-manager workflow with appropriate parameters
/git-commit-manager.md \
  --type "chore" \
  --scope "state" \
  --subject "update project context and progress" \
  --body "Updated activeContext with current focus
Refreshed progress metrics  
Captured learnings in retro-inbox
Synchronized state files" \
  --workflow "state-update"

# Note: The git-commit-manager workflow handles:
# - Staging appropriate files
# - Creating semantic commit
# - Pushing changes (with offline fallback)
# - Updating gitContext.md if exists
```

## PR Review Status Check
Check for PRs with pending reviews and FIX tasks:
```bash
# Check for PRs with pending reviews
if command -v gh &> /dev/null; then
    OPEN_PRS=$(gh pr list --state open --json number,title,reviewDecision 2>/dev/null || echo "[]")
    if [ "$OPEN_PRS" != "[]" ]; then
        REVIEWS_PENDING=$(echo "$OPEN_PRS" | jq '[.[] | select(.reviewDecision == "CHANGES_REQUESTED")] | length')
        
        if [ "$REVIEWS_PENDING" -gt 0 ]; then
            echo "⚠️ PRs with changes requested: $REVIEWS_PENDING"
            echo "Run /github-pr-review.md to process feedback and generate fix tasks"
        fi
    fi
    
    # Check for completed FIX tasks
    if ls .holicode/specs/tasks/FIX-* 2>/dev/null; then
        FIX_TASKS_TOTAL=$(ls .holicode/specs/tasks/FIX-* | wc -l)
        FIX_TASKS_COMPLETE=$(grep -l "State: DONE" .holicode/specs/tasks/FIX-* 2>/dev/null | wc -l || echo "0")
        echo "FIX Tasks: $FIX_TASKS_COMPLETE/$FIX_TASKS_TOTAL completed"
        
        if [ "$FIX_TASKS_COMPLETE" -lt "$FIX_TASKS_TOTAL" ]; then
            echo "Outstanding FIX tasks need attention"
        fi
    fi
fi
```

## Validation Check
<invoke_workflow>
<workflow>state-health-check.md</workflow>
</invoke_workflow>

## Sync with GitHub (Optional)
<ask_followup_question>
<question>Should I update any GitHub issues or PRs to reflect the current state?</question>
</ask_followup_question>

<!-- If yes, update activeContext.md with GitHub links -->
