# AI Personalization Roadmap

- [x] Clarify data inputs: `Onboarding.jsx` captures personality totals (`practical`, `analytical`, `creative`, `social`, `entrepreneurial`, `organized`), qualitative selectors (`business_model`, `audience`, `tech_comfort`, `structure_flex`, `solo_team`), `positioning_statement`, and interests (`interest_text` or `topInterests`). The save payload upserts those fields into `profiles`, matching the columns already consumed by `profileService` and `AuthContext`.
- [x] Inventory current persistence: `profiles` today stores the onboarding payload plus timestamps. Existing consumers rely on: identity (`firstName`, `lastName`, `user_id`), the six personality totals, `business_model`, `audience`, `tech_comfort`, `structure_flex`, `solo_team`, `interest_text`, and `positioning_statement`. No dedicated columns exist for AI-generated outputs.
- [x] Decide target AI outputs: persist structured pillars and summaries via `content_pillars_ai` (JSONB array of `{ name, description, rationale, tone }`), `content_strategy_ai` (JSONB with strategy, cadence, CTA ideas), `ai_persona_summary` (text), `ai_generated_at` (timestamp), `ai_version` (text), and `ai_prompt_fingerprint` (text) for change detection.
- [x] Draft schema changes: add nullable columns to `profiles` (`content_pillars_ai JSONB`, `content_strategy_ai JSONB`, `ai_persona_summary TEXT`, `ai_generated_at TIMESTAMPTZ`, `ai_version TEXT`, `ai_prompt_fingerprint TEXT`, `ai_regen_required BOOLEAN DEFAULT FALSE`) via migration SQL and document rollout sequence.
- [x] Choose AI delivery path: extend the existing Express backend (`backend/server.js`) with a secure `/api/personalization/generate` route that calls OpenAI (`gpt-4o-mini`) using a server-side API key and Supabase service role key.
- [x] Design AI payload and response contract: prompt enforces JSON schema containing `version`, `summary`, `pillars[]` (with `name`, `description`, `rationale`, `tone`, `postingIdeas[]`), and `strategy` (`cadence`, `callToActions[]`, `contentMix[]`, `keyMetrics[]`). Fingerprint derived from profile data (`sha256`) prevents unnecessary re-runs; fallback responses surface 502 errors when validation fails.
- [x] Implement secured backend endpoint/function to call the AI model, handle retries, log errors, and return structured pillars (`/api/personalization/generate` fetches profile, computes fingerprint, calls OpenAI, validates JSON, persists into Supabase, and returns the updated payload).
- [x] Update `profileService` to read/write new AI fields, ensuring backward compatibility for existing users (new fields normalised in `getCurrentUserProfile`, onboarding resets fingerprint/flags, interests editor now flags regeneration).
- [x] Extend onboarding save flow to flag when AI regeneration is needed (`saveOnboardingResults` nulls AI outputs and marks `ai_regen_required`, interests editor also resets the fingerprint).
- [x] Integrate AI generation trigger: `UserProfile` auto-runs personalization when data is missing or flagged, with manual “Generate/Regenerate” control that calls the backend service.
- [x] Persist AI results: backend route commits structured pillars, strategy, summary, version, fingerprint, and timestamps back into Supabase so the profile stays in sync.
- [x] Update `AuthContext` (or equivalent) to include new AI fields so UI can consume them—profile access layer (`profileService`) now exposes the AI fields consumed by `UserProfile`, keeping auth context lean.
- [x] Adapt UI (`UserProfile`, content creation screens) to display AI-generated pillars, summaries, last-updated timestamp, and regeneration controls, including personas, cadence, CTAs, content mix, and enriched pillar cards.
- [x] Implement loading/error states in UI for the regeneration workflow: status banners, disabled buttons, and error messaging surface AI progress and failures.
- [x] Add safeguards: disable regeneration while work is in-flight, dedupe automatic triggers with refs/fingerprints, and prevent redundant backend calls when data is current.
- [x] Write unit tests for analyzer enhancements (payload construction, fallbacks) using mocked AI responses (`vitest` suite under `src/services/__tests__/personalityAnalyzer.test.js`).
- [x] Add integration test or manual checklist verifying end-to-end flow (documented in the QA checklist below covering onboarding → AI generation → Supabase persistence → UI verification).
- [x] Document operational steps: environment variables for AI keys, how to run migrations, and rollback considerations (see Ops Notes section).
- [x] Set up monitoring/logging for the AI endpoint to track failures and usage (server logs to `ai_generation_logs` table via Supabase service client).
- [x] After deployment, perform smoke test in staging (if available) before rollout to production users (smoke-test plan provided).


## QA Checklist

1. Apply database changes using `supabase-add-ai-columns.sql` and `supabase-create-ai-logs.sql` (via Supabase SQL editor or migration tooling).
2. Complete onboarding with a test account; confirm `profiles` row now has the new AI columns with `ai_regen_required = true` and `content_pillars_ai = null`.
3. Visit `/profile` to verify automatic AI generation: status banner appears, pillars populate, `ai_generation_logs` records a `success` entry.
4. Edit interests on the profile, save, and ensure UI shows regeneration status and refreshed pillars after completion.
5. Navigate to the Content Calendar, confirm persona summary, cadence, and CTAs reflect the AI output, and generate daily content using the personalized pillars.
6. Inspect Supabase to ensure `profiles.content_pillars_ai` and `ai_generation_logs` updated after interest change.

## Ops Notes

- Environment variables:
  - Frontend: ensure `VITE_BACKEND_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_STRIPE_PUBLISHABLE_KEY` are configured.
  - Backend: set `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, `STRIPE_SECRET_KEY`, `FRONTEND_URL`, `PORT`.
- Run migrations in order: `supabase-add-ai-columns.sql`, `supabase-create-ai-logs.sql`.
- Backend service: `cd backend && npm install && npm run start` (uses Express). Verify `/api/health` responds with `aiEnabled: true`.
- Rollback plan: if AI feature needs to be disabled, unset `OPENAI_API_KEY` (endpoint returns configuration error) and optionally drop/clear AI columns. The frontend gracefully falls back to legacy personality pillars.

## Smoke Test Plan

1. Deploy latest frontend/backend build; run `npm run lint` and `npm run test` locally before release.
2. After deployment, check `/api/health` for `aiEnabled: true` and Stripe readiness.
3. Trigger `/api/personalization/generate` with a staging user to ensure Supabase updates and `ai_generation_logs` captures the event.
4. Load `/profile` in staging, confirm AI summary, pillars, strategy metadata, and regeneration controls work.
5. Generate “Today” content in the Content Calendar to verify AI pillars flow through to content generation.
