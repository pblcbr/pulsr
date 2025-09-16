-- MVP Database Schema for Pulsr
-- Simplified version focusing on core functionality

-- Users (handled by Supabase Auth)
-- No need for custom users table, Supabase handles this

-- Profiles - Essential user information for AI onboarding
create table profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  bio text,
  sector text,
  audience text,
  tone text,
  positioning_statement text,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- Content Pillars - Core content themes
create table pillars (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamp default now()
);

-- Social Accounts - Only X (Twitter) for MVP
create table social_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  platform text not null check (platform in ('x', 'twitter')),
  handle text,
  access_token text,
  refresh_token text,
  connected_at timestamp default now()
);

-- Topic Ideas - AI-generated content suggestions
create table topic_ideas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  pillar_id uuid references pillars(id) on delete cascade,
  title text not null,
  description text,
  score numeric default 0,
  created_at timestamp default now()
);

-- Draft Posts - Content in various stages
create table draft_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  platform text not null check (platform in ('x', 'twitter')),
  text text not null,
  media_url text,
  status text not null check (status in ('draft','review','approved','scheduled','published','failed')),
  scheduled_at timestamp,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- Publications - Published posts with metrics
create table publications (
  id uuid primary key default gen_random_uuid(),
  draft_post_id uuid references draft_posts(id) on delete set null,
  social_account_id uuid references social_accounts(id) on delete set null,
  external_post_id text,
  status text check (status in ('published','failed')),
  impressions int default 0,
  likes int default 0,
  comments int default 0,
  reposts int default 0,
  published_at timestamp,
  created_at timestamp default now()
);

-- Feedback - User feedback for AI learning
create table feedback (
  id uuid primary key default gen_random_uuid(),
  draft_post_id uuid references draft_posts(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  rating int check (rating in (1, 2, 3, 4, 5)),
  feedback_text text,
  created_at timestamp default now()
);

-- Knowledge Assets - User uploaded content for AI training
create table knowledge_assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  type text check (type in ('document', 'link', 'text')),
  title text,
  content text,
  source_url text,
  created_at timestamp default now()
);

-- Event Logs - System events for debugging
create table event_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  event_type text not null,
  payload jsonb,
  created_at timestamp default now()
);

-- Indexes for performance
create index idx_profiles_user_id on profiles(user_id);
create index idx_pillars_user_id on pillars(user_id);
create index idx_social_accounts_user_id on social_accounts(user_id);
create index idx_topic_ideas_user_id on topic_ideas(user_id);
create index idx_topic_ideas_pillar_id on topic_ideas(pillar_id);
create index idx_draft_posts_user_id on draft_posts(user_id);
create index idx_draft_posts_status on draft_posts(status);
create index idx_draft_posts_scheduled_at on draft_posts(scheduled_at);
create index idx_publications_draft_post_id on publications(draft_post_id);
create index idx_feedback_draft_post_id on feedback(draft_post_id);
create index idx_knowledge_assets_user_id on knowledge_assets(user_id);
create index idx_event_logs_user_id on event_logs(user_id);

-- Row Level Security (RLS) policies
alter table profiles enable row level security;
alter table pillars enable row level security;
alter table social_accounts enable row level security;
alter table topic_ideas enable row level security;
alter table draft_posts enable row level security;
alter table publications enable row level security;
alter table feedback enable row level security;
alter table knowledge_assets enable row level security;
alter table event_logs enable row level security;

-- RLS Policies - Users can only access their own data
create policy "Users can view own profile" on profiles for select using (auth.uid() = user_id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = user_id);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = user_id);

create policy "Users can manage own pillars" on pillars for all using (auth.uid() = user_id);
create policy "Users can manage own social accounts" on social_accounts for all using (auth.uid() = user_id);
create policy "Users can manage own topic ideas" on topic_ideas for all using (auth.uid() = user_id);
create policy "Users can manage own draft posts" on draft_posts for all using (auth.uid() = user_id);
create policy "Users can manage own publications" on publications for all using (auth.uid() = user_id);
create policy "Users can manage own feedback" on feedback for all using (auth.uid() = user_id);
create policy "Users can manage own knowledge assets" on knowledge_assets for all using (auth.uid() = user_id);
create policy "Users can manage own event logs" on event_logs for all using (auth.uid() = user_id);
