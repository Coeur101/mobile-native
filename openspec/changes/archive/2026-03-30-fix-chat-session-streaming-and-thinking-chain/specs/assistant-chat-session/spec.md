## ADDED Requirements

### Requirement: Assistant responses SHALL stream inside the active chat session
The system MUST surface assistant output incrementally inside the active editor chat session while generation is in progress, instead of waiting for the final project payload before rendering any assistant content.

#### Scenario: User starts a new generation
- **WHEN** the user submits a valid prompt in the editor and AI generation starts
- **THEN** the system MUST render an in-progress assistant draft bubble inside the current chat session
- **AND** the draft bubble MUST update as new assistant text chunks arrive from the AI service boundary

#### Scenario: User continues an existing project
- **WHEN** the user submits a follow-up prompt for an existing project
- **THEN** the system MUST keep prior persisted messages visible
- **AND** it MUST append a single in-progress assistant draft for the current generation rather than waiting for completion

### Requirement: Thinking steps SHALL be visible during generation
The system MUST expose in-progress thinking-step state during assistant generation so the user can observe the current reasoning lifecycle before the final assistant message is persisted.

#### Scenario: Provider emits incremental thinking progress
- **WHEN** the AI service boundary reports thinking-step updates during generation
- **THEN** the system MUST update the visible thought-chain state in the active assistant draft
- **AND** each step MUST preserve a status of `pending`, `loading`, `success`, or `error`

#### Scenario: Thinking steps are unavailable from the provider
- **WHEN** the current provider does not emit usable thinking-step events
- **THEN** the system MUST continue streaming assistant text if available
- **AND** it MUST keep the chat session usable without fabricating unsupported thinking details

### Requirement: Chat generation SHALL use an explicit lifecycle state
The system MUST distinguish the active assistant generation lifecycle with explicit states so the editor can consistently control input, scrolling, and completion behavior.

#### Scenario: Generation is actively streaming
- **WHEN** assistant chunks or thinking updates are still arriving
- **THEN** the active chat session state MUST be `streaming`
- **AND** the editor MUST prevent duplicate submissions for the same generation

#### Scenario: Final result is being persisted
- **WHEN** the AI service has produced a final normalized result and the app is writing authoritative project data
- **THEN** the active chat session state MUST transition to `persisting`
- **AND** the draft assistant bubble MUST remain visible until persistence finishes or fails

#### Scenario: Generation fails
- **WHEN** the AI request or normalization step fails before completion
- **THEN** the active chat session state MUST transition to `failed`
- **AND** the user MUST receive an actionable error while the unfinished draft is not persisted as an authoritative project message

### Requirement: Draft chat state SHALL be replaced by the persisted final assistant message
The system MUST treat streaming assistant output as temporary session state and replace it with the persisted assistant message after a successful project mutation completes.

#### Scenario: Generation finishes successfully
- **WHEN** the project create or continue mutation succeeds
- **THEN** the system MUST remove the temporary draft assistant state from the active chat session
- **AND** it MUST render the persisted assistant message returned from authoritative project data in the correct chronological order

#### Scenario: User revisits the project later
- **WHEN** the project is reloaded after a completed generation
- **THEN** the chat session MUST show only authoritative persisted messages
- **AND** it MUST NOT restore transient streaming chunks as separate historical records
