-- Project persistence tables for AI Web Builder Mobile.
-- Runtime code currently depends on:
--   - public.projects
--   - public.project_versions
--   - public.project_messages
--
-- Notes:
-- 1. Auth/profile data still comes from auth.users + user_metadata.
-- 2. user_settings is still local-only in the current app boundary.

begin;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.projects (
  id text primary key,
  owner_user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  description text not null default '',
  status text not null default 'active' check (status in ('draft', 'active', 'archived')),
  files jsonb not null default '{}'::jsonb,
  preview jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.project_versions (
  id text primary key,
  version_no integer not null check (version_no > 0),
  summary text not null,
  files jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  project_id text not null references public.projects (id) on delete cascade,
  owner_user_id uuid not null references auth.users (id) on delete cascade,
  unique (project_id, version_no)
);

create table if not exists public.project_messages (
  id text primary key,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamptz not null default timezone('utc', now()),
  project_id text not null references public.projects (id) on delete cascade,
  owner_user_id uuid not null references auth.users (id) on delete cascade,
  thinking_steps jsonb,
  metadata jsonb
);

create index if not exists idx_projects_owner_updated_at
  on public.projects (owner_user_id, updated_at desc);

create index if not exists idx_project_versions_project_version_no
  on public.project_versions (project_id, version_no desc);

create index if not exists idx_project_versions_owner_created_at
  on public.project_versions (owner_user_id, created_at desc);

create index if not exists idx_project_messages_project_created_at
  on public.project_messages (project_id, created_at asc);

create index if not exists idx_project_messages_owner_created_at
  on public.project_messages (owner_user_id, created_at desc);

drop trigger if exists set_projects_updated_at on public.projects;

create trigger set_projects_updated_at
before update on public.projects
for each row
execute function public.set_updated_at();

alter table public.projects enable row level security;
alter table public.project_versions enable row level security;
alter table public.project_messages enable row level security;

drop policy if exists "projects_select_own" on public.projects;
create policy "projects_select_own"
on public.projects
for select
using (auth.uid() = owner_user_id);

drop policy if exists "projects_insert_own" on public.projects;
create policy "projects_insert_own"
on public.projects
for insert
with check (auth.uid() = owner_user_id);

drop policy if exists "projects_update_own" on public.projects;
create policy "projects_update_own"
on public.projects
for update
using (auth.uid() = owner_user_id)
with check (auth.uid() = owner_user_id);

drop policy if exists "projects_delete_own" on public.projects;
create policy "projects_delete_own"
on public.projects
for delete
using (auth.uid() = owner_user_id);

drop policy if exists "project_versions_select_own" on public.project_versions;
create policy "project_versions_select_own"
on public.project_versions
for select
using (auth.uid() = owner_user_id);

drop policy if exists "project_versions_insert_own" on public.project_versions;
create policy "project_versions_insert_own"
on public.project_versions
for insert
with check (
  auth.uid() = owner_user_id
  and exists (
    select 1
    from public.projects p
    where p.id = project_versions.project_id
      and p.owner_user_id = auth.uid()
  )
);

drop policy if exists "project_versions_update_own" on public.project_versions;
create policy "project_versions_update_own"
on public.project_versions
for update
using (auth.uid() = owner_user_id)
with check (auth.uid() = owner_user_id);

drop policy if exists "project_versions_delete_own" on public.project_versions;
create policy "project_versions_delete_own"
on public.project_versions
for delete
using (auth.uid() = owner_user_id);

drop policy if exists "project_messages_select_own" on public.project_messages;
create policy "project_messages_select_own"
on public.project_messages
for select
using (auth.uid() = owner_user_id);

drop policy if exists "project_messages_insert_own" on public.project_messages;
create policy "project_messages_insert_own"
on public.project_messages
for insert
with check (
  auth.uid() = owner_user_id
  and exists (
    select 1
    from public.projects p
    where p.id = project_messages.project_id
      and p.owner_user_id = auth.uid()
  )
);

drop policy if exists "project_messages_update_own" on public.project_messages;
create policy "project_messages_update_own"
on public.project_messages
for update
using (auth.uid() = owner_user_id)
with check (auth.uid() = owner_user_id);

drop policy if exists "project_messages_delete_own" on public.project_messages;
create policy "project_messages_delete_own"
on public.project_messages
for delete
using (auth.uid() = owner_user_id);

commit;
