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
The system MUST define a project table model where each project is associated with the current authenticated user.

#### Scenario: User creates a project
- **WHEN** an authenticated user creates a project
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