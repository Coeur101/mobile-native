## ADDED Requirements

### Requirement: Authenticated user profile must have a configured backing record
The system MUST define a configured user profile record model for each authenticated account.

#### Scenario: User registration completes
- **WHEN** a new user finishes email verification and account creation
- **THEN** the system MUST be able to map that authenticated account to a configured user profile record

#### Scenario: Existing user session is restored
- **WHEN** an authenticated session is restored on app start
- **THEN** the system MUST be able to resolve the current user profile identity used by project data

### Requirement: Project records must be owned by the authenticated user
The system MUST define a project table model where each project is associated with the current authenticated user.

#### Scenario: User creates a project
- **WHEN** an authenticated user creates a new project
- **THEN** the project record MUST carry a reference to that authenticated user

#### Scenario: User loads project list
- **WHEN** the app requests the current user's project list
- **THEN** the project data model MUST support filtering by the authenticated user's identity

### Requirement: Project versions and messages must align to the project model
The system MUST define project version and project message records that attach to the configured project record.

#### Scenario: Project version is created
- **WHEN** a user saves a new version snapshot for a project
- **THEN** the version record MUST reference the parent project record

#### Scenario: Project conversation is stored
- **WHEN** the app stores project-related conversation or generation history
- **THEN** the message record MUST reference the parent project record

### Requirement: User settings must have a configured user-level record
The system MUST define a user settings record that can be associated with the authenticated user profile.

#### Scenario: User saves settings
- **WHEN** an authenticated user updates personal settings
- **THEN** the system MUST support persisting those settings against the current user identity
