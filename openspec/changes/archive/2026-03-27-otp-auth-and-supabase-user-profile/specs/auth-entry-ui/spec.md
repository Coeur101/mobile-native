## MODIFIED Requirements

### Requirement: Authentication entry screen must establish clear interaction hierarchy
The system MUST present the authentication entry experience with a clear OTP-first interaction hierarchy for login, registration, and reset paths, without exposing password login as a competing primary action.

#### Scenario: User lands on the login screen
- **WHEN** a user opens the authentication page on a mobile viewport
- **THEN** the screen MUST present the email + verification-code flow as the primary login path before any optional security messaging

#### Scenario: Active auth flow is rendered
- **WHEN** a specific auth path is active
- **THEN** the screen MUST show exactly one primary CTA for that step and visually subordinate helper actions

### Requirement: Mode switching must behave like navigation, not submission
The system MUST separate auth-path switching controls from submission controls.

#### Scenario: User switches between login, register, and reset paths
- **WHEN** a user changes the active auth path
- **THEN** the UI MUST treat that interaction as navigation and MUST NOT style or position it like the current step's submit button

#### Scenario: User reviews available auth paths
- **WHEN** the entry screen presents login, register, and reset paths
- **THEN** the switcher MUST visually communicate which path is selected without implying that selection alone submits data

### Requirement: Secondary actions must be progressively disclosed
The system MUST avoid exposing all auxiliary auth actions at the same visual weight as the main OTP step.

#### Scenario: User is completing login
- **WHEN** the login OTP flow is active
- **THEN** resend-code and path-switching actions MUST appear as lower-priority affordances than the main verification CTA

#### Scenario: User is completing registration
- **WHEN** the registration flow is active
- **THEN** explanatory copy and optional actions MUST support the current verification step without crowding the main progression path
