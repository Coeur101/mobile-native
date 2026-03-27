## Why

Project creation and continuation still depend on a bundled `mockAIService`, which means the authenticated project persistence flow now writes real project records that still come from fake generation output. That leaves the core product loop half-migrated: projects persist remotely, but the actual generation boundary is not configurable, not production-capable, and not aligned with the user settings surface that already captures model, base URL, and API key input.

## What Changes

- Replace the runtime `mockAIService` dependency with a real AI generation boundary that issues OpenAI-compatible HTTP requests.
- Reuse the existing local settings record for `preferredModel`, `customBaseUrl`, and `apiKey` so generation can run against a configured provider without adding a new backend dependency first.
- Require structured project payload output and reject invalid or partial AI responses instead of silently saving fake content.
- Preserve the existing `ProjectService` contract so project creation and continuation flows stay stable for the app shell while the generation boundary changes underneath.
- Add targeted verification for configuration validation, request composition, structured-response parsing, and project generation integration.

- Non-goals:
  - This change does not introduce a remote settings backend; settings remain device-local for now.
  - This change does not add server-side proxying, usage metering, billing controls, or multi-provider account management.
  - This change does not redesign the editor workflow beyond surfacing actionable AI configuration and response errors.

## Capabilities

### Modified Capabilities

- `project-data`: project generation and continuation now depend on a configured AI boundary instead of a bundled mock generator.

## Impact

- Affected code:
  - `src/services/ai/*`
  - `src/services/project/supabase-project-service.ts`
  - `src/services/settings/*`
  - `src/pages/editor/EditorPage.tsx`
  - `src/pages/settings/SettingsPage.tsx`
  - `src/pages/profile/UserProfilePage.tsx`
  - `tests/vitest/*`
- External systems:
  - OpenAI-compatible chat completion endpoint configured by user settings
- Docs and governance:
  - `openspec/specs/project-data/spec.md`
  - `TASK.json`
