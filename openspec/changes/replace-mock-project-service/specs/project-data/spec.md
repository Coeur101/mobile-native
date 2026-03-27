## MODIFIED Requirements

### Requirement: Project records must be owned by the authenticated user
The system MUST persist authenticated user project records in the configured backing data store and treat that backing record as the authoritative source for project CRUD operations.

#### Scenario: User creates a project
- **WHEN** an authenticated user creates a project
- **THEN** the system MUST write the project record to the configured backing store with a reference to that authenticated user
- **AND** the created project returned to the app MUST include the persisted ownership and identifier fields

#### Scenario: User loads project list
- **WHEN** the app requests the current user's project list
- **THEN** the system MUST query the backing store filtered by the authenticated user's identity
- **AND** the system MUST NOT surface unrelated local-only residue as another user's active project data

#### Scenario: User updates or deletes a project
- **WHEN** an authenticated user renames, edits, or deletes a project
- **THEN** the system MUST apply that mutation against the authoritative backing store instead of only mutating local cache state

### Requirement: Project versions and messages must align to the project model
The system MUST persist project version snapshots and project messages as records attached to the authoritative project record so history survives app restarts and authenticated session restoration.

#### Scenario: Project version is created
- **WHEN** a user saves a new version snapshot for a project
- **THEN** the system MUST persist the version record with a reference to the parent project record in the backing store

#### Scenario: Project conversation is stored
- **WHEN** the app stores project-related conversation or generation history
- **THEN** the system MUST persist the message record with a reference to the parent project record in the backing store

#### Scenario: User restores a historical version
- **WHEN** the user restores a previous project version
- **THEN** the system MUST update the current project state from that version and preserve an auditable restoration record in the same authoritative model

## ADDED Requirements

### Requirement: Local project cache must not be the source of truth for authenticated users
The system MUST treat locally persisted project data as cache or migration material only, not as the authoritative project record for an authenticated user.

#### Scenario: Remote and local project state differ
- **WHEN** the locally cached project snapshot differs from the authoritative backing record
- **THEN** the system MUST prefer the remote project state and refresh the local cache from that authoritative result

#### Scenario: Legacy local projects are migrated for the current user
- **WHEN** an authenticated user has legacy local projects that have not yet been migrated
- **THEN** the system MUST migrate only the current user's eligible project records into the configured backing store before marking them as migrated

#### Scenario: Another user's local residue exists on the device
- **WHEN** the device still contains local project data from a different user identity
- **THEN** the system MUST NOT merge or expose those records inside the current authenticated user's remote-backed project list
