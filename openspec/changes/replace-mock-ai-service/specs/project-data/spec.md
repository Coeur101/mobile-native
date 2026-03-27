## ADDED Requirements

### Requirement: Project generation must use a configured AI service boundary
The system MUST generate new and updated project payloads through a configured AI service boundary instead of a bundled mock implementation.

#### Scenario: User creates a project with valid AI settings
- **WHEN** an authenticated user submits a prompt and the current settings record contains a model, base URL, and API key
- **THEN** the system MUST call the configured AI endpoint
- **AND** the generated project payload returned to persistence MUST include structured files, summary text, and assistant message metadata

#### Scenario: User continues an existing project
- **WHEN** the user submits a follow-up prompt for an existing project
- **THEN** the system MUST include the current project context in the AI request
- **AND** the returned payload MUST be applied through the same project persistence flow used for initial creation

### Requirement: Invalid AI configuration must block project mutation
The system MUST reject project generation before persistence when the current AI configuration is incomplete or obviously placeholder-only.

#### Scenario: Missing provider settings
- **WHEN** the current settings record has no API key, no usable base URL, or no usable model
- **THEN** the system MUST stop the generation request
- **AND** it MUST surface an actionable error telling the user to complete AI settings first

### Requirement: Invalid AI responses must not be persisted
The system MUST validate the AI response before creating or updating a project record.

#### Scenario: Provider returns invalid JSON
- **WHEN** the upstream model response cannot be parsed into the expected project payload structure
- **THEN** the system MUST reject the generation attempt
- **AND** it MUST NOT persist a partial project update

#### Scenario: Provider omits required files
- **WHEN** the parsed response does not include `index.html`, `style.css`, or `main.js`
- **THEN** the system MUST reject the response as invalid
- **AND** it MUST ask for a corrected generation on the next retry instead of fabricating missing files locally
