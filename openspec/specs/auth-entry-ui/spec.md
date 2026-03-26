# auth-entry-ui Specification

## Purpose
TBD - created by archiving change redesign-login-page-interaction-ui. Update Purpose after archive.
## Requirements
### Requirement: Authentication entry screen must establish clear interaction hierarchy
The system MUST present the authentication entry experience with distinct visual layers for entry selection, active form content, primary action, and secondary actions.

#### Scenario: User lands on the login screen
- **WHEN** a user opens the authentication page on a mobile viewport
- **THEN** the screen MUST present a clear primary focus area before showing detailed form actions

#### Scenario: Active auth flow is rendered
- **WHEN** a specific auth mode is active
- **THEN** the screen MUST show exactly one primary CTA for that step and visually subordinate helper actions

### Requirement: Mode switching must behave like navigation, not submission
The system MUST separate auth-mode switching controls from submission controls.

#### Scenario: User switches from password login to OTP login
- **WHEN** a user changes the active auth mode
- **THEN** the UI MUST treat that interaction as navigation and MUST NOT style or position it like the current step's submit button

#### Scenario: User reviews available auth paths
- **WHEN** the login screen presents login, register, and reset paths
- **THEN** the mode switcher MUST visually communicate which path is selected without implying that selection alone submits data

### Requirement: Secondary actions must be progressively disclosed
The system MUST avoid exposing all auxiliary auth actions at the same visual weight as the main step.

#### Scenario: User is completing password login
- **WHEN** the password login form is active
- **THEN** secondary actions such as password recovery or path switching MUST appear as lower-priority affordances than the main login CTA

#### Scenario: User is completing registration
- **WHEN** the registration flow is active
- **THEN** explanatory copy and optional actions MUST support the current step without crowding the main progression path

### Requirement: Authentication state changes must provide visible feedback
The system MUST provide noticeable but lightweight UI feedback for state changes inside the auth flow.

#### Scenario: User changes auth mode
- **WHEN** the active auth mode changes
- **THEN** the screen MUST provide a transition or state-change cue that makes the new context obvious

#### Scenario: User triggers validation or error feedback
- **WHEN** the current step fails validation or returns an auth error
- **THEN** the feedback MUST appear in the context of the active step rather than blending with unrelated actions

