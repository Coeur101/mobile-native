## Context

The repository already persists authenticated user projects to a real backing store, but `createProject()` and `continueProject()` still call `mockAIService`. At the same time, the app already exposes a settings surface for:

- `preferredModel`
- `customBaseUrl`
- `apiKey`

That means the product already collects exactly the configuration needed to call a real provider, but the generation boundary never uses it.

## Goals / Non-Goals

**Goals:**

- Introduce a real, testable AI service boundary that can call an OpenAI-compatible endpoint with the currently configured model and credentials.
- Keep the `AIService` and `ProjectService` integration surface stable so the rest of the app only changes where necessary.
- Enforce structured generation output so project persistence never stores malformed or partial AI payloads.
- Surface clear Chinese error messages for missing configuration, upstream failures, and invalid model output.

**Non-Goals:**

- No remote settings sync in this change.
- No provider marketplace or multi-endpoint fallback tree.
- No server proxy or secret-management redesign.

## Decisions

### Decision 1: Use an OpenAI-compatible JSON contract over plain browser `fetch`

Choice:

- Implement a dedicated AI service that issues `POST /chat/completions` requests with a strict JSON-only response contract.
- Keep transport logic inside the AI boundary, not inside `ProjectService`.

Rationale:

- The settings model already stores a model name, custom base URL, and API key, which maps cleanly onto an OpenAI-compatible request shape.
- A browser-native `fetch` client keeps the implementation lightweight and easy to fake in Vitest.
- Requiring structured JSON lets the app validate output before persisting project state.

Alternatives rejected:

- Keep using the bundled mock and just rename it: rejected because it would not remove the fake generation boundary.
- Add a new SDK dependency: rejected because the current repo does not need another client layer for a single HTTP contract.

### Decision 2: Resolve AI configuration from the existing settings service at call time

Choice:

- Read `preferredModel`, `customBaseUrl`, and `apiKey` from the current settings service whenever a generation call begins.

Rationale:

- This preserves the current settings UX and avoids coupling generation to build-time environment variables.
- Resolving at call time means the user can update settings and immediately retry generation without reloading the app.

Alternatives rejected:

- Read configuration from env only: rejected because the UI already captures per-device values.
- Cache settings at module load time: rejected because it would make retries and settings changes stale.

### Decision 3: Fail closed on invalid configuration or invalid model output

Choice:

- If model, base URL, or API key are missing, throw an actionable Chinese error before any project mutation happens.
- If the provider response is empty, not parseable JSON, or missing required files, reject the operation instead of synthesizing fallback files.

Rationale:

- Once project persistence is real, silent fallback content would hide integration failures and produce misleading remote data.
- Explicit failures are easier to debug and safer than fake success states.

Alternatives rejected:

- Fallback to `mockAIService` when config is missing: rejected because it keeps the runtime fake boundary in place.
- Auto-fill missing fields with placeholder files: rejected because it would make verification ambiguous.

### Decision 4: Keep settings backend scope separate, but stop importing mock AI at runtime

Choice:

- This change may introduce a unified settings export if needed by the AI boundary, but it does not attempt to solve remote settings persistence.
- Runtime code must stop importing `mockAIService`.

Rationale:

- The actual backlog item is the AI generation boundary.
- The settings-local-only backlog can remain open without blocking real generation as long as local settings drive the AI boundary.

## Risks / Trade-offs

- [Browser-side API keys can be exposed in dev tools] -> accepted for now because the existing product already stores API keys locally and remote settings/proxying is explicitly out of scope for this change.
- [OpenAI-compatible providers vary in JSON enforcement quality] -> mitigate by validating required fields locally and returning actionable parse errors.
- [User settings may still contain the legacy default `mock-gpt`] -> mitigate by treating missing or obviously placeholder configuration as invalid and surfacing remediation guidance.
