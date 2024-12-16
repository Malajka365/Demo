-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create secure schema for auth-related functions
create schema if not exists auth;
grant usage on schema auth to public;

-- Set up storage for user avatars
do $$
begin
  if not exists (select 1 from storage.buckets where id = 'avatars') then
    insert into storage.buckets (id, name, public) 
    values ('avatars', 'avatars', true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies 
    where tablename = 'objects' 
    and policyname = 'Avatar images are publicly accessible'
  ) then
    create policy "Avatar images are publicly accessible"
      on storage.objects for select
      using ( bucket_id = 'avatars' );
  end if;

  if not exists (
    select 1 from pg_policies 
    where tablename = 'objects' 
    and policyname = 'Anyone can upload an avatar'
  ) then
    create policy "Anyone can upload an avatar"
      on storage.objects for insert
      with check ( bucket_id = 'avatars' );
  end if;

  if not exists (
    select 1 from pg_policies 
    where tablename = 'objects' 
    and policyname = 'Users can update their own avatar'
  ) then
    create policy "Users can update their own avatar"
      on storage.objects for update
      using ( auth.uid() = owner );
  end if;
end $$;

-- Create tables
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique,
  avatar_url text,
  email text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint username_length check (char_length(username) >= 3)
);

-- Enable Row Level Security
alter table public.profiles enable row level security;

-- Profiles policies
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where tablename = 'profiles' 
    and policyname = 'Public profiles are viewable by everyone'
  ) then
    create policy "Public profiles are viewable by everyone"
      on public.profiles for select
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies 
    where tablename = 'profiles' 
    and policyname = 'Users can insert their own profile'
  ) then
    create policy "Users can insert their own profile"
      on public.profiles for insert
      with check (auth.uid() = id);
  end if;

  if not exists (
    select 1 from pg_policies 
    where tablename = 'profiles' 
    and policyname = 'Users can update own profile'
  ) then
    create policy "Users can update own profile"
      on public.profiles for update
      using (auth.uid() = id);
  end if;
end $$;

-- Függvények
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  username_val text;
  avatar_url_val text;
begin
  -- Avatar URL kinyerése a meta adatokból
  avatar_url_val := new.raw_user_meta_data->>'avatar_url';
  
  -- Username generálása
  if (new.raw_user_meta_data->>'name') is not null then
    username_val := lower(regexp_replace(new.raw_user_meta_data->>'name', '\s+', '_', 'g'));
  else
    username_val := coalesce(
      split_part(new.email, '@', 1),
      'user_' || substr(new.id::text, 1, 8)
    );
  end if;

  -- Username egyediségének biztosítása
  while exists (select 1 from public.profiles where username = username_val) loop
    username_val := username_val || '_' || substr(md5(random()::text), 1, 4);
  end loop;

  -- Profil létrehozása
  insert into public.profiles (
    id,
    username,
    avatar_url,
    email,
    created_at,
    updated_at
  ) values (
    new.id,
    username_val,
    avatar_url_val,
    new.email,
    now(),
    now()
  );
  
  return new;
end;
$$;

-- Trigger az updated_at mező automatikus frissítéséhez
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
security definer
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

-- Triggerek
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

drop trigger if exists on_profile_updated on public.profiles;
create trigger on_profile_updated
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

-- Create indexes
create index if not exists users_email_idx on auth.users (email);
create index if not exists profiles_username_idx on public.profiles (username);