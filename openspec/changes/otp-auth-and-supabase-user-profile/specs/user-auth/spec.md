## MODIFIED Requirements

### Requirement: User can register with email verification and password setup
The system MUST allow a new user to register by verifying an email address in a mobile-friendly OTP flow and completing account creation immediately after verification, without requiring password setup during registration.

#### Scenario: New user completes OTP registration
- **WHEN** a user enters a valid email, receives a verification code, and successfully verifies that code
- **THEN** the system MUST create the account, mark the email as verified, and enter the authenticated area

#### Scenario: Registration cannot skip verification
- **WHEN** a user has not completed email verification
- **THEN** the system MUST NOT finalize account registration

### Requirement: User can log in with either password or email verification code
The system MUST use email verification code as the only login method exposed in the primary authentication flow.

#### Scenario: User logs in with email verification code
- **WHEN** a registered user requests a login code, submits the received valid code, and verification succeeds
- **THEN** the system MUST sign the user in and enter the authenticated area

#### Scenario: Invalid verification code is rejected
- **WHEN** the submitted verification code is invalid
- **THEN** the system MUST reject the login and show an actionable error state

### Requirement: Authentication flow must be mobile-friendly
The system MUST present the email registration and login experience in a mobile-friendly, step-based interaction model that centers on OTP verification and avoids exposing password login on the entry screen.

#### Scenario: Mobile user enters authentication flow
- **WHEN** a user opens the authentication screen on a mobile device
- **THEN** the system MUST prioritize a progressive OTP-based step flow instead of exposing password login controls

#### Scenario: User chooses an auth path
- **WHEN** a user reaches the entry screen
- **THEN** the system MUST allow the user to choose between login, register, and reset paths without offering password as a peer login mode

### Requirement: High-risk verification extension point must exist
The auth model MUST support additional email-code verification for sensitive post-login account operations without reintroducing password login as a primary auth path.

#### Scenario: Normal daily login remains OTP-only
- **WHEN** a user performs a normal daily login
- **THEN** the system MUST authenticate the user through the primary email-code flow only

#### Scenario: Sensitive profile security action requires stronger verification
- **WHEN** a signed-in user starts a password setup or password reset action from the profile area
- **THEN** the auth model MUST support inserting an additional email-code verification step before the password can be updated

## ADDED Requirements

### Requirement: Password can be configured as an optional post-login security enhancement
The system MUST treat password as an optional security enhancement that can be configured after sign-in, rather than as a required or primary login method.

#### Scenario: User chooses not to configure a password
- **WHEN** a newly registered or returning user signs in successfully through OTP and does not set a password
- **THEN** the system MUST continue to allow normal future sign-in through OTP-only authentication

#### Scenario: User configures a password after sign-in
- **WHEN** a signed-in user completes the verified profile security flow to set a password
- **THEN** the system MUST persist that password capability as account security state without changing the primary login path away from OTP

## REMOVED Requirements

### Requirement: Password recovery must be available
**Reason**: Password management is moving out of the login page and into the authenticated profile security flow, gated by email verification code.
**Migration**: Replace login-page password recovery entry points with the profile-page “设置密码 / 重置密码” verified security flow.
