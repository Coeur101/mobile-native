## MODIFIED Requirements

### Requirement: Project versions and messages must align to the project model
The system MUST persist project version snapshots and authoritative project messages as records attached to the authoritative project record so history survives app restarts and authenticated session restoration, while keeping in-progress streaming assistant drafts outside the authoritative persisted message set until generation completes.

#### Scenario: Project version is created
- **WHEN** a user saves a new version snapshot for a project
- **THEN** the system MUST persist the version record with a reference to the parent project record in the backing store

#### Scenario: Project conversation is stored
- **WHEN** the app stores project-related conversation or generation history after a successful project mutation
- **THEN** the system MUST persist the final assistant message record with a reference to the parent project record in the backing store
- **AND** it MUST persist only normalized final thinking-step data that belongs to that authoritative assistant message

#### Scenario: Streaming generation is still in progress
- **WHEN** assistant text chunks or intermediate thinking updates are being rendered in the active chat session
- **THEN** the system MUST keep that draft state outside the authoritative persisted project message history
- **AND** it MUST NOT write partial chunks as standalone authoritative message records

#### Scenario: User restores a historical version
- **WHEN** the user restores a previous project version
- **THEN** the system MUST update the current project state from that version
- **AND** preserve an auditable restoration record in the same authoritative model
