## ADDED Requirements

### Requirement: User can register with email verification and password setup
The system MUST allow a new user to register by verifying an email address and setting a password in a mobile-friendly step flow.

#### Scenario: New user completes registration
- **WHEN** a user enters a valid email, receives a verification code, successfully verifies the code, and sets a valid password
- **THEN** the system MUST create the account and mark the email as verified

#### Scenario: Registration cannot skip verification
- **WHEN** a user has not completed email verification
- **THEN** the system MUST NOT finalize password-based account registration

### Requirement: User can log in with either password or email verification code
The system MUST support both password login and email verification-code login for the same email account.

#### Scenario: User logs in with password
- **WHEN** a registered user submits a valid email and correct password
- **THEN** the system MUST sign the user in and enter the authenticated area

#### Scenario: User logs in with email verification code
- **WHEN** a registered user requests a login code, submits the received valid code, and verification succeeds
- **THEN** the system MUST sign the user in and enter the authenticated area

#### Scenario: Invalid credentials are rejected
- **WHEN** the submitted password or verification code is invalid
- **THEN** the system MUST reject the login and show an actionable error state

### Requirement: Authentication flow must be mobile-friendly
The system MUST present the email registration and login experience in a mobile-friendly, step-based interaction model.

#### Scenario: Mobile user enters authentication flow
- **WHEN** a user opens the authentication screen on a mobile device
- **THEN** the system MUST prioritize a progressive step flow instead of exposing all registration and login fields at once

#### Scenario: User chooses a login path
- **WHEN** a user reaches the login step
- **THEN** the system MUST allow the user to choose between password login and verification-code login

### Requirement: Authenticated state must persist on the client for seven days
The system MUST keep authenticated login information on the client for seven days unless the user explicitly signs out earlier.

#### Scenario: Valid remembered session is restored
- **WHEN** the app starts within seven days of the remembered login window and the backing auth session is still valid
- **THEN** the system MUST restore the authenticated user state before protected routing is evaluated

#### Scenario: Remembered session has expired
- **WHEN** more than seven days have passed since the remembered login window started
- **THEN** the system MUST clear the local remembered auth state and require the user to log in again

#### Scenario: User signs out manually
- **WHEN** a signed-in user explicitly signs out
- **THEN** the system MUST remove the local remembered auth state immediately

### Requirement: Password recovery must be available
The system MUST provide a password recovery entry point for users who choose password login.

#### Scenario: User forgets password
- **WHEN** a user selects the password recovery path
- **THEN** the system MUST provide a recover-password flow tied to the user email

### Requirement: High-risk verification extension point must exist
The system MUST preserve a design-compatible extension point for future high-risk verification using an additional email code.

#### Scenario: High-risk verification is not enabled by default
- **WHEN** a user performs a normal daily login
- **THEN** the system MUST NOT require a second email-code challenge by default in this change

#### Scenario: Sensitive action requires stronger verification in the future
- **WHEN** a future flow marks an action as high-risk
- **THEN** the auth model MUST support inserting an additional email-code verification step without replacing the primary login modes
