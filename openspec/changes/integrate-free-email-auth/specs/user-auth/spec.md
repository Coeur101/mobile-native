## ADDED Requirements

### Requirement: Real email authentication must replace mock email login

The system MUST replace the current mock email login with a real email-based authentication flow.

#### Scenario: User requests email login

- **WHEN** a user submits a valid email on the login page
- **THEN** the system MUST start a real email authentication flow instead of creating a local mock user

#### Scenario: Email auth succeeds

- **WHEN** the authentication provider confirms a valid email login
- **THEN** the system MUST persist a real signed-in session and route the user into the authenticated area

### Requirement: Email login must support a free-first delivery path

The system MUST support an email authentication mode that can operate within a free-tier setup.

#### Scenario: Free-tier email auth is configured

- **WHEN** the deployment has valid free-tier auth and SMTP configuration
- **THEN** the system MUST allow real email login without requiring paid identity infrastructure

### Requirement: Authenticated session must survive app restart

The system MUST restore a valid authenticated email session on app restart or page reload.

#### Scenario: Existing session is present

- **WHEN** the app starts and a valid auth session already exists
- **THEN** the system MUST restore the authenticated user state before protected routing is evaluated

### Requirement: Login failures must be explicit

The system MUST surface real email authentication failures instead of silently falling back to mock success.

#### Scenario: Email login fails

- **WHEN** the email authentication provider rejects the login attempt
- **THEN** the system MUST show an actionable error state

### Requirement: WeChat is out of scope for this change

The system MUST NOT treat WeChat login as implemented by this change.

#### Scenario: Login page is updated for this change

- **WHEN** the login experience is adjusted as part of this change
- **THEN** it MUST NOT imply that WeChat login is available as a real authentication path
