## ADDED Requirements

### Requirement: Authenticated user can access a dedicated profile entry
The system MUST replace the home-page settings shortcut with a dedicated user-profile entry for authenticated users.

#### Scenario: User opens the account entry from home
- **WHEN** an authenticated user taps the top-right account icon on the home page
- **THEN** the system MUST route the user to a dedicated personal-profile screen instead of the old general settings entry

### Requirement: Profile screen must present core account information
The system MUST provide a personal-profile screen that displays the current user's avatar, nickname, and email address, and exposes theme switching inline.

#### Scenario: User opens profile screen
- **WHEN** the authenticated user enters the personal-profile screen
- **THEN** the system MUST show the current avatar, nickname, email address, and theme mode controls in the same account-oriented view

### Requirement: New users must receive default profile data
The system MUST create default profile data for first-time registered users, including a default nickname and a default avatar.

#### Scenario: First registration completes
- **WHEN** a user finishes the first successful email-verification registration flow
- **THEN** the system MUST create a profile record with a generated default nickname and a generated default avatar

### Requirement: Avatar uploads must be compressed and stored as base64
The system MUST compress user-uploaded avatars on the client before encoding them as base64 and persisting them to the user's profile record.

#### Scenario: User uploads a new avatar
- **WHEN** a user selects an image file for the profile avatar
- **THEN** the system MUST compress the image before converting it to base64
- **AND** it MUST persist the compressed base64 payload in the user's profile record instead of storing a path-based reference

### Requirement: Password management must live inside the profile security area
The system MUST expose password setup and password reset as optional security actions inside the personal-profile screen, not on the login page.

#### Scenario: User has not configured a password
- **WHEN** the personal-profile screen loads for a user without a configured password
- **THEN** the security area MUST show a “设置密码” action

#### Scenario: User already configured a password
- **WHEN** the personal-profile screen loads for a user with a configured password
- **THEN** the security area MUST show a “重置密码” action

### Requirement: Password security actions must require email-code verification
The system MUST require an email verification code before allowing the user to set or reset a password from the profile screen.

#### Scenario: User sets a password from profile
- **WHEN** a signed-in user starts the “设置密码” flow
- **THEN** the system MUST send and verify an email code before accepting a new password

#### Scenario: User resets a password from profile
- **WHEN** a signed-in user starts the “重置密码” flow
- **THEN** the system MUST send and verify an email code before accepting the replacement password
