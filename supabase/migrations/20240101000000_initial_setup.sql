-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create secure schema for auth-related functions
create schema if not exists auth;
grant usage on schema auth to public;

-- Set up storage for user avatars
insert into storage.buckets (id, name, public) 
select 'avatars', 'avatars', true
where not exists (
    select 1 from storage.buckets where id = 'avatars'
);

create policy "Avatar images are publicly accessible"
  on storage.objects for select
  using ( bucket_id = 'avatars' );

create policy "Anyone can upload an avatar"
  on storage.objects for insert
  with check ( bucket_id = 'avatars' );

create policy "Users can update their own avatar"
  on storage.objects for update
  using ( auth.uid() = owner );

-- Create auth schema tables
create table if not exists auth.users (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  encrypted_password text not null,
  email_confirmed_at timestamp with time zone,
  invited_at timestamp with time zone,
  confirmation_token text,
  confirmation_sent_at timestamp with time zone,
  recovery_token text,
  recovery_sent_at timestamp with time zone,
  email_change_token text,
  email_change text,
  email_change_sent_at timestamp with time zone,
  last_sign_in_at timestamp with time zone,
  raw_app_meta_data jsonb,
  raw_user_meta_data jsonb,
  is_super_admin boolean,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create public schema tables
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint username_length check (char_length(username) >= 3)
);

create table if not exists public.galleries (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  name text not null,
  description text,
  category text not null,
  visibility text not null default 'private',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint name_length check (char_length(name) >= 3 and char_length(name) <= 100),
  constraint description_length check (description is null or char_length(description) <= 5000),
  constraint category_values check (category in ('gaming', 'music', 'education', 'entertainment', 'other')),
  constraint visibility_values check (visibility in ('public', 'authenticated', 'private'))
);

create table if not exists public.videos (
  id uuid primary key default uuid_generate_v4(),
  gallery_id uuid references public.galleries on delete cascade not null,
  title text not null,
  description text,
  youtube_id text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint title_length check (char_length(title) >= 3 and char_length(title) <= 100),
  constraint description_length check (description is null or char_length(description) <= 5000),
  constraint youtube_id_format check (youtube_id ~ '^[A-Za-z0-9_-]{11}$')
);

create table if not exists public.tag_groups (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  name text not null,
  tags text[] default array[]::text[],
  category text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint name_length check (char_length(name) >= 2),
  constraint category_values check (category in ('gaming', 'music', 'education', 'entertainment', 'other'))
);

-- Create indexes
create index if not exists users_email_idx on auth.users (email);
create index if not exists profiles_username_idx on public.profiles (username);
create index if not exists galleries_user_id_idx on public.galleries (user_id);
create index if not exists galleries_category_idx on public.galleries (category);
create index if not exists galleries_visibility_idx on public.galleries (visibility);
create index if not exists videos_gallery_id_idx on public.videos (gallery_id);
create index if not exists tag_groups_user_id_idx on public.tag_groups (user_id);
create index if not exists tag_groups_category_idx on public.tag_groups (category);
create index if not exists tag_groups_user_category_idx on public.tag_groups (user_id, category);

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.galleries enable row level security;
alter table public.videos enable row level security;
alter table public.tag_groups enable row level security;

-- Profiles policies
create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Galleries policies
create policy "Public galleries are viewable by everyone"
  on public.galleries for select
  using (visibility = 'public');

create policy "Authenticated users can view restricted galleries"
  on public.galleries for select
  using (
    visibility = 'authenticated' 
    and auth.role() = 'authenticated'
  );

create policy "Users can view their own galleries"
  on public.galleries for select
  using (auth.uid() = user_id);

create policy "Authenticated users can insert galleries"
  on public.galleries for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own galleries"
  on public.galleries for update
  using (auth.uid() = user_id);

create policy "Users can delete own galleries"
  on public.galleries for delete
  using (auth.uid() = user_id);

-- Videos policies
create policy "Videos are viewable through gallery permissions"
  on public.videos for select
  using (
    exists (
      select 1 from public.galleries g
      where g.id = gallery_id
      and (
        g.visibility = 'public'
        or (g.visibility = 'authenticated' and auth.role() = 'authenticated')
        or g.user_id = auth.uid()
      )
    )
  );

create policy "Users can insert videos into their galleries"
  on public.videos for insert
  to authenticated
  with check (
    exists (
      select 1 from public.galleries g
      where g.id = gallery_id
      and g.user_id = auth.uid()
    )
  );

create policy "Users can update videos in their galleries"
  on public.videos for update
  using (
    exists (
      select 1 from public.galleries g
      where g.id = gallery_id
      and g.user_id = auth.uid()
    )
  );

create policy "Users can delete videos from their galleries"
  on public.videos for delete
  using (
    exists (
      select 1 from public.galleries g
      where g.id = gallery_id
      and g.user_id = auth.uid()
    )
  );

-- Tag groups policies
create policy "Tag groups are viewable by everyone"
  on public.tag_groups for select
  using (true);

create policy "Users can manage their own tag groups"
  on public.tag_groups for select
  using (auth.uid() = user_id);

create policy "Authenticated users can insert tag groups"
  on public.tag_groups for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own tag groups"
  on public.tag_groups for update
  using (auth.uid() = user_id);

create policy "Users can delete own tag groups"
  on public.tag_groups for delete
  using (auth.uid() = user_id);

-- Functions
create or replace function public.handle_new_user()
returns trigger
security definer
set search_path = public
language plpgsql
as $$
begin
  insert into public.profiles (id, username)
  values (new.id, new.raw_user_meta_data->>'username');
  return new;
end;
$$;

create or replace function public.handle_updated_at()
returns trigger
security definer
set search_path = public
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Triggers
do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'on_auth_user_created') then
    create trigger on_auth_user_created
      after insert on auth.users
      for each row execute procedure public.handle_new_user();
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'on_profile_updated') then
    create trigger on_profile_updated
      before update on public.profiles
      for each row execute procedure public.handle_updated_at();
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'on_gallery_updated') then
    create trigger on_gallery_updated
      before update on public.galleries
      for each row execute procedure public.handle_updated_at();
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'on_video_updated') then
    create trigger on_video_updated
      before update on public.videos
      for each row execute procedure public.handle_updated_at();
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'on_tag_group_updated') then
    create trigger on_tag_group_updated
      before update on public.tag_groups
      for each row execute procedure public.handle_updated_at();
  end if;
end $$;