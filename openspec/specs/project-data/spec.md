# project-data Specification

## Purpose
Define the authoritative account/profile and project ownership boundaries for authenticated users.

## Requirements

### Requirement: Authenticated user profile must have a configured backing record
The system MUST define a Supabase-backed user profile record for each authenticated account and use that record as the authoritative source for personal information.

#### Scenario: User registration completes
- **WHEN** a new user finishes email verification and account creation
- **THEN** the system MUST create or resolve a Supabase-backed user profile record for that authenticated account

#### Scenario: Existing user session is restored
- **WHEN** an authenticated session is restored on app start
- **THEN** the system MUST resolve the current user's identity against the Supabase-backed profile record before treating local profile data as current

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
- **THEN** the system MUST update the current project state from that version
- **AND** preserve an auditable restoration record in the same authoritative model

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

### Requirement: User settings must have a configured user-level record
The system MUST support a user-level preferences record scoped to the authenticated user, while keeping personal identity data separate from generic app preferences.

#### Scenario: User updates theme preference
- **WHEN** an authenticated user changes the theme mode from the personal-profile screen
- **THEN** the system MUST persist that preference against the current authenticated user identity

### Requirement: User profile record must include default identity fields
The system MUST support a user profile record that stores nickname, avatar base64 payload, email address, and password configuration state for the authenticated user.

#### Scenario: Profile record is created for a new account
- **WHEN** the system provisions a profile record for a first-time authenticated user
- **THEN** the record MUST include a default nickname, a default avatar payload, the user email, and an explicit password configuration state

#### Scenario: Profile record is updated by the user
- **WHEN** the authenticated user updates nickname or avatar
- **THEN** the system MUST persist those changes to the same user profile record instead of saving them only to local storage

### Requirement: Local profile cache must not be the source of truth
The system MUST treat local persisted user information as a cache only, not as the authoritative backing record for user profile data.

#### Scenario: Local cache and remote profile differ
- **WHEN** the locally cached profile snapshot differs from the Supabase profile record
- **THEN** the system MUST prefer the Supabase-backed profile data as the current truth

### Requirement: Project generation must use a configured AI service boundary
The system MUST generate new and updated project payloads through a configured AI service boundary instead of a bundled mock implementation.

#### Scenario: User creates a project with valid AI settings
- **WHEN** an authenticated user submits a prompt and the current settings record contains a model, base URL, and API key
- **THEN** the system MUST call the configured AI endpoint
- **AND** the generated project payload returned to persistence MUST include structured files, summary text, and assistant message metadata

#### Scenario: User continues an existing project
- **WHEN** the user submits a follow-up prompt for an existing project
- **THEN** the system MUST include the current project context in the AI request
- **AND** the returned payload MUST be applied through the same project persistence flow used for initial creation

### Requirement: Invalid AI configuration must block project mutation
The system MUST reject project generation before persistence when the current AI configuration is incomplete or obviously placeholder-only.

#### Scenario: Missing provider settings
- **WHEN** the current settings record has no API key, no usable base URL, or no usable model
- **THEN** the system MUST stop the generation request
- **AND** it MUST surface an actionable error telling the user to complete AI settings first

### Requirement: Invalid AI responses must not be persisted
The system MUST validate the AI response before creating or updating a project record.

#### Scenario: Provider returns invalid JSON
- **WHEN** the upstream model response cannot be parsed into the expected project payload structure
- **THEN** the system MUST reject the generation attempt
- **AND** it MUST NOT persist a partial project update

#### Scenario: Provider omits required files
- **WHEN** the parsed response does not include `index.html`, `style.css`, or `main.js`
- **THEN** the system MUST reject the response as invalid
- **AND** it MUST ask for a corrected generation on the next retry instead of fabricating missing files locally
