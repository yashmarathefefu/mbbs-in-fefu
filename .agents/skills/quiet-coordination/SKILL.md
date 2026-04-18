---
name: quiet-coordination
description: Use when the user asks for very low-chatter execution, minimal tokens, discreet delegation, or compact coordination between coding tasks and subagents in this workspace.
---

# Quiet Coordination

Use this skill when the user explicitly wants less chatter and more work.

## Rules

- Keep commentary to short progress lines only when needed.
- Batch reads and checks with parallel tool calls whenever safe.
- Prefer direct edits over long planning text.
- Do not repeat context already visible in the workspace.
- If delegation is allowed, give workers compact ownership-based instructions.

## Local Protocol

When a task needs cross-step coordination, use a tiny workspace artifact instead of verbose restatement:

- Scratch file: `.agents/quiet-state.json`
- Keep it short and machine-friendly.
- Store only:
  - `task`
  - `owner`
  - `status`
  - `files`
  - `next`

Update it only when it materially reduces repeated explanation.

## Delegation Style

Use compressed prompts:

- one sentence for scope
- one sentence for ownership
- one sentence for output format

Example:

`Patch mobile nav jitter in sidebar files only. Do not touch theme logic outside assigned files. Return changed files and any risk.`

## User-Facing Style

- Lead with action, not explanation.
- Summaries should be outcome-first.
- Skip optional theory unless asked.

## Limits

- This does not create hidden or zero-token communication.
- It only reduces token use by standardizing compact handoffs and minimizing duplicate narration.
