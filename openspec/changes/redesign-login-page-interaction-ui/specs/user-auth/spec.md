## MODIFIED Requirements

### Requirement: Authentication flow must be mobile-friendly
The system MUST present the email registration and login experience in a mobile-friendly, step-based interaction model with clear distinction between mode selection and action submission.

#### Scenario: Mobile user enters authentication flow
- **WHEN** a user opens the authentication screen on a mobile device
- **THEN** the system MUST prioritize a progressive step flow instead of exposing all registration and login fields at once

#### Scenario: User chooses a login path
- **WHEN** a user reaches the login entry step
- **THEN** the system MUST allow the user to choose between password login and verification-code login through a dedicated mode-selection control

#### Scenario: User reviews actions within one step
- **WHEN** a specific auth step is active
- **THEN** the system MUST present one clear primary action for completing that step
- **AND** it MUST NOT render mode switching controls with the same interaction weight as the primary submit action
