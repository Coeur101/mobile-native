# development-workflow Specification

## ADDED Requirements

### Requirement: Three-phase project workflow

The project MUST govern delivery through three phases:

- Definition
- Delivery
- Closure

Each change MUST move through these phases in order.

#### Scenario: Change enters Delivery

- **Given** a change has completed intake, research, design, and planning
- **And** design review is complete
- **When** the change is ready to start coding
- **Then** it may enter the Delivery phase

#### Scenario: Change enters Closure

- **Given** implementation review is complete
- **And** all required verification has passed
- **When** the change is ready for finalization
- **Then** it may enter the Closure phase

### Requirement: Change lifecycle states

Each change MUST use an explicit lifecycle with the following states:

- `intake`
- `research`
- `design`
- `design_review`
- `planned`
- `implementation`
- `implementation_review`
- `verified`
- `committed`
- `archived`
- `blocked`

#### Scenario: Incomplete design cannot start implementation

- **Given** a change has not completed `design_review`
- **When** implementation is requested
- **Then** the change must not enter `implementation`

### Requirement: Design review before implementation

The project MUST complete design review before implementation begins.

Design review MUST evaluate:

- requirement clarity
- architecture or solution scope
- risks and non-goals
- task decomposition readiness

#### Scenario: Design review fails

- **Given** design review finds missing scope or unresolved risk
- **When** the review result is recorded
- **Then** the change must return to `research` or `design`

### Requirement: Implementation review before closure

The project MUST complete implementation review after coding and before final closure.

Implementation review MUST evaluate:

- alignment with the approved design
- unreported deviations
- regression risk
- task history completeness

#### Scenario: Implementation review fails

- **Given** implementation review finds defects or design drift
- **When** the review result is recorded
- **Then** the change must return to `implementation`

### Requirement: Task-level closed-loop delivery

The project MUST treat each delivery task as an independently closed unit of work.

Each task MUST:

- be registered in `TASK.json`
- reference its parent OpenSpec change
- declare which quality gates are required
- remain open until all required gates complete

#### Scenario: User-facing feature task

- **Given** a task changes user-visible behavior or interaction
- **When** the task is created
- **Then** it must set `uiTestsRequired` to `true`
- **And** it must not enter `done` until automated UI verification is recorded

#### Scenario: Governance task

- **Given** a task changes only workflow documents or repository governance
- **When** the task is created
- **Then** functional tests, UI tests, and build checks may be marked not required
- **And** the task still must record documentation evidence before entering `done`

### Requirement: Append-only task history

The project MUST keep append-only execution history for every task in `openspec/changes/<change>/logs/<task-id>.jsonl`.

Each history event MUST record:

- task identifier
- timestamp
- actor
- step name
- status transition
- result
- evidence type
- evidence reference
- blockers

#### Scenario: Task step completes

- **Given** a task passes a workflow step
- **When** the agent advances the task
- **Then** it must append a new history event before claiming the step complete

### Requirement: Automated UI verification for user-facing work

The project MUST require Playwright-based automated UI verification for user-facing tasks.

User-facing work includes:

- visual layout changes
- interaction flow changes
- critical state or error-state changes
- navigation or primary action changes

#### Scenario: UI automation is required

- **Given** a task affects the rendered interface
- **When** the verification phase begins
- **Then** the agent must generate and run Playwright tests for that task
- **And** the result summary must be written into task history

### Requirement: Ephemeral generated test artifacts

Generated tests and their runtime artifacts MUST be treated as ephemeral by default.

Ephemeral artifacts include:

- generated unit or integration test files
- generated Playwright test files
- Playwright reports
- screenshots
- traces
- videos
- temporary output directories

The agent MUST record the result before deleting the generated artifacts.

#### Scenario: Temporary test run completes

- **Given** the agent generated temporary tests for a task
- **When** the test run finishes
- **Then** the agent must write the execution summary to task history
- **And** delete the generated test files and runtime artifacts
- **And** refuse to mark the task `done` if cleanup does not complete

### Requirement: Change archive gating

An OpenSpec change MUST NOT be archived until all of its tasks are complete and both reviews are done.

#### Scenario: Change still has open work

- **Given** a change has at least one task not in `done`
- **Or** design review is missing
- **Or** implementation review is missing
- **When** archive is requested
- **Then** the archive must be rejected

#### Scenario: Change is eligible for archive

- **Given** all tasks for a change are in `done`
- **And** no blocker remains
- **And** all required evidence has been recorded
- **And** temporary generated test artifacts were cleaned up
- **And** both reviews are complete
- **When** archive is requested
- **Then** the change may be archived
