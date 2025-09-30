-- Adds AI personalization fields to the profiles table.
alter table if exists public.profiles
  add column if not exists content_pillars_ai jsonb,
  add column if not exists content_strategy_ai jsonb,
  add column if not exists ai_persona_summary text,
  add column if not exists ai_generated_at timestamptz,
  add column if not exists ai_version text,
  add column if not exists ai_prompt_fingerprint text,
  add column if not exists ai_regen_required boolean default false;

-- Optional helper index to query regenerated profiles quickly.
create index if not exists profiles_ai_regen_required_idx
  on public.profiles (ai_regen_required)
  where ai_regen_required is true;
