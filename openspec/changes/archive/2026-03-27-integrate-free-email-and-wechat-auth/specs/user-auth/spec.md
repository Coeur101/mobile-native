## ADDED Requirements

### Requirement: Real email authentication must replace mock email login

The system MUST replace the current mock email login with a real email-based authentication flow.

#### Scenario: User requests email login

- **WHEN** a user submits a valid email on the login page
- **THEN** the system MUST start a real authentication flow instead of creating a local mock user

#### Scenario: Email auth succeeds

- **WHEN** the authentication provider confirms a valid email login
- **THEN** the system MUST persist a real signed-in session and route the user into the authenticated area

### Requirement: Email login must support a free-first delivery path

The system MUST support an email authentication mode that can operate within a free-tier setup.

#### Scenario: Free-tier email auth is configured

- **WHEN** the deployment has valid free-tier email auth and SMTP configuration
- **THEN** the system MUST allow real email login without requiring paid identity infrastructure

### Requirement: WeChat login must be capability-gated

The system MUST treat WeChat login as a capability that is only available when required external configuration is present.

#### Scenario: WeChat capability is unavailable

- **WHEN** the system lacks required WeChat credentials, certification, or broker configuration
- **THEN** the login experience MUST show WeChat as unavailable or restricted
- **AND** the system MUST NOT simulate a successful WeChat sign-in

#### Scenario: WeChat capability is available

- **WHEN** the system has the required WeChat configuration and broker support
- **THEN** it MUST allow the user to start a real WeChat authentication flow

### Requirement: Auth providers must expose consistent session behavior

The system MUST normalize authenticated user state across supported login providers.

#### Scenario: A provider login completes

- **WHEN** either email login or WeChat login completes successfully
- **THEN** the system MUST expose a consistent authenticated user shape to routing and page guards

### Requirement: Login failures must be explicit

The system MUST surface real authentication failures instead of silently falling back to mock success.

#### Scenario: Email login fails

- **WHEN** the email authentication provider rejects the login attempt
- **THEN** the system MUST show an actionable error state

#### Scenario: WeChat login is requested without capability

- **WHEN** the user taps WeChat login while the capability is unavailable
- **THEN** the system MUST explain that the provider is not currently enabled
