-- Complete the remaining product-level tables:
--   - public.profiles
--   - public.user_settings
--
-- Current app notes:
-- 1. Runtime auth still reads auth.users + user_metadata first.
-- 2. This migration creates formal public tables for future convergence.

begin;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null default '',
  nickname text not null default '',
  avatar_base64 text not null default '',
  provider text not null default 'email',
  email_verified boolean not null default false,
  has_password boolean not null default false,
  last_sign_in_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.user_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  theme text not null default 'auto' check (theme in ('light', 'dark', 'auto')),
  preferred_model text not null default '',
  custom_base_url text not null default '',
  api_key text not null default '',
  notes text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_profiles_email on public.profiles (email);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists set_user_settings_updated_at on public.user_settings;
create trigger set_user_settings_updated_at
before update on public.user_settings
for each row
execute function public.set_updated_at();

create or replace function public.sync_profile_from_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  metadata jsonb;
  resolved_email text;
  resolved_nickname text;
  resolved_avatar text;
  resolved_provider text;
  resolved_has_password boolean;
begin
  metadata := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  resolved_email := coalesce(new.email, '');
  resolved_nickname := nullif(trim(coalesce(metadata ->> 'full_name', '')), '');
  resolved_avatar := coalesce(metadata ->> 'avatar_base64', '');
  resolved_provider := coalesce(nullif(trim(metadata ->> 'provider'), ''), 'email');
  resolved_has_password := case
    when metadata ? 'has_password' and jsonb_typeof(metadata -> 'has_password') = 'boolean'
      then (metadata ->> 'has_password')::boolean
    when lower(coalesce(metadata ->> 'has_password', '')) in ('true', 'false')
      then (metadata ->> 'has_password')::boolean
    else false
  end;

  if resolved_nickname is null then
    resolved_nickname := split_part(resolved_email, '@', 1);
  end if;

  insert into public.profiles (
    id,
    email,
    nickname,
    avatar_base64,
    provider,
    email_verified,
    has_password,
    last_sign_in_at,
    created_at,
    updated_at
  )
  values (
    new.id,
    resolved_email,
    resolved_nickname,
    resolved_avatar,
    resolved_provider,
    new.email_confirmed_at is not null,
    resolved_has_password,
    new.last_sign_in_at,
    coalesce(new.created_at, timezone('utc', now())),
    timezone('utc', now())
  )
  on conflict (id) do update
  set
    email = excluded.email,
    nickname = excluded.nickname,
    avatar_base64 = excluded.avatar_base64,
    provider = excluded.provider,
    email_verified = excluded.email_verified,
    has_password = excluded.has_password,
    last_sign_in_at = excluded.last_sign_in_at,
    updated_at = timezone('utc', now());

  insert into public.user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists sync_profile_from_auth_user on auth.users;
create trigger sync_profile_from_auth_user
after insert or update on auth.users
for each row
execute function public.sync_profile_from_auth_user();

insert into public.profiles (
  id,
  email,
  nickname,
  avatar_base64,
  provider,
  email_verified,
  has_password,
  last_sign_in_at,
  created_at,
  updated_at
)
select
  u.id,
  coalesce(u.email, '') as email,
  coalesce(
    nullif(trim(coalesce(u.raw_user_meta_data ->> 'full_name', '')), ''),
    split_part(coalesce(u.email, ''), '@', 1)
  ) as nickname,
  coalesce(u.raw_user_meta_data ->> 'avatar_base64', '') as avatar_base64,
  coalesce(nullif(trim(u.raw_user_meta_data ->> 'provider'), ''), 'email') as provider,
  u.email_confirmed_at is not null as email_verified,
  case
    when u.raw_user_meta_data ? 'has_password'
      and jsonb_typeof(u.raw_user_meta_data -> 'has_password') = 'boolean'
      then (u.raw_user_meta_data ->> 'has_password')::boolean
    when lower(coalesce(u.raw_user_meta_data ->> 'has_password', '')) in ('true', 'false')
      then (u.raw_user_meta_data ->> 'has_password')::boolean
    else false
  end as has_password,
  u.last_sign_in_at,
  coalesce(u.created_at, timezone('utc', now())),
  timezone('utc', now())
from auth.users u
on conflict (id) do update
set
  email = excluded.email,
  nickname = excluded.nickname,
  avatar_base64 = excluded.avatar_base64,
  provider = excluded.provider,
  email_verified = excluded.email_verified,
  has_password = excluded.has_password,
  last_sign_in_at = excluded.last_sign_in_at,
  updated_at = timezone('utc', now());

insert into public.user_settings (user_id)
select u.id
from auth.users u
on conflict (user_id) do nothing;

alter table public.profiles enable row level security;
alter table public.user_settings enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "profiles_delete_own" on public.profiles;
create policy "profiles_delete_own"
on public.profiles
for delete
using (auth.uid() = id);

drop policy if exists "user_settings_select_own" on public.user_settings;
create policy "user_settings_select_own"
on public.user_settings
for select
using (auth.uid() = user_id);

drop policy if exists "user_settings_insert_own" on public.user_settings;
create policy "user_settings_insert_own"
on public.user_settings
for insert
with check (auth.uid() = user_id);

drop policy if exists "user_settings_update_own" on public.user_settings;
create policy "user_settings_update_own"
on public.user_settings
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "user_settings_delete_own" on public.user_settings;
create policy "user_settings_delete_own"
on public.user_settings
for delete
using (auth.uid() = user_id);

commit;
