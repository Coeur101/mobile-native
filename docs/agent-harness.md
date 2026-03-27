# Agent Harness

## Why

Anthropic's "Effective harnesses for long-running agents" argues that long-running agents should not depend on keeping every detail in live context. The durable parts of the workflow should live in files that can be regenerated, resumed, and audited.

This repository already has the main state sources:

- `openspec/changes/*` for requirements, design, and task context
- `TASK.json` for the structured task ledger
- `openspec/changes/<change>/logs/*.jsonl` for task history
- `Playwright`, `Vitest`, and `pnpm build` for real verification

The harness layer does not invent a new task system. It reads the existing state, compresses it, and turns it into a self-recovering execution loop.

## What The Harness Adds

### 1. Initializer Harness

`pnpm agent:init`

Outputs:

- `.agent-harness/feature-list.json`
- `.agent-harness/init.md`

Purpose:

- compress `TASK.json + OpenSpec` into an agent-friendly feature list
- generate a stable session startup reference

### 2. Session Bearings

`pnpm agent:refresh`

Outputs:

- `.agent-harness/session-brief.md`

Purpose:

- generate a low-context recovery brief for the current session
- list the current focus task, required reads, required verification, and next queue

### 3. Orchestration Decision

`pnpm agent:orchestrate`

Outputs:

- `.agent-harness/orchestration.json`

Purpose:

- continue the current `in_progress` task when one exists
- otherwise pick the highest-priority actionable task from the most active change

Current ordering rules:

1. Prefer the current active change.
2. Prefer `in_progress` over `todo`.
3. Prefer `P0` over `P1`, `P2`, and `P3`.
4. Prefer `delivery` over `closure`.
5. Within the same change, order by task id.

### 4. Session Progress Bridge

`pnpm agent:log -- <event> <task-id> "<summary>" --verification "<command/result>" --next "<next step>"`

Writes:

- `.agent-harness/progress.jsonl`

Purpose:

- record session-level start, checkpoint, and done events
- preserve the "why this changed" and "what happens next" context outside task logs

### 5. Advance Cycle

`pnpm agent:advance -- <TASK-ID> "<summary>" --status docs_verified --verification "pnpm build" --next "Implement next task"`

Purpose:

- update the completed task status in `TASK.json`
- append a completion event to `.agent-harness/progress.jsonl`
- append a completion event to the current task's OpenSpec log
- clean tracked temporary test artifacts
- refresh `feature-list.json`, `session-brief.md`, and `orchestration.json`
- write `.agent-harness/claimed-task.json`
- automatically claim the next actionable task and move it to `in_progress`
- append a start event for the newly claimed task to both progress and task history

Cleanup scope:

- `test-results/`
- `playwright-report/`
- `.tmp/task-runs/playwright/`
- `.tmp/task-runs/vitest/`
- `.tmp/playwright-*.out`
- `.tmp/playwright-*.err`

State kept after cleanup:

- OpenSpec task logs
- `.agent-harness/*.json|*.md|*.jsonl`
- `TASK.json`
- the latest claimed task context

## Recommended Flow

1. Run `pnpm agent:init`.
2. Run `pnpm agent:refresh`.
3. Read `.agent-harness/session-brief.md`.
4. Read the current focus task's `mustRead` files.
5. Complete one atomic task.
6. Run that task's verification commands.
7. Record important progress with `pnpm agent:log`.
8. Finish the cycle with `pnpm agent:advance`.
9. Continue with the next claimed task.

## Why This Repo Reuses Existing Tools

This repository already has strong state sources:

- OpenSpec defines change context.
- `TASK.json` defines task ordering and status.
- task logs provide a cross-session evidence trail.
- Playwright, Vitest, and build checks provide real acceptance gates.

The harness only does four things:

- read
- sort
- compress
- bridge

That keeps the workflow durable without introducing another task platform.
