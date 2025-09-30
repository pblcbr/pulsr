-- Stores AI personalization generation attempts for monitoring.
create table if not exists public.ai_generation_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  status text not null,
  fingerprint text,
  message text,
  created_at timestamptz default now()
);

create index if not exists ai_generation_logs_user_id_idx
  on public.ai_generation_logs (user_id);

create index if not exists ai_generation_logs_created_at_idx
  on public.ai_generation_logs (created_at desc);
