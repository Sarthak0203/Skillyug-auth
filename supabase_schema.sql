create extension if not exists "uuid-ossp";

create table if not exists public.user_profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text unique not null,
  full_name text not null,
  user_type text check (user_type in ('student', 'instructor', 'admin')) not null,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  email_verified boolean default false not null,
  last_sign_in_at timestamp with time zone
);

alter table public.user_profiles enable row level security;

create policy "Users can view own profile" 
  on public.user_profiles for select 
  using (auth.uid() = id);

create policy "Users can update own profile" 
  on public.user_profiles for update 
  using (auth.uid() = id);

create policy "Users can insert own profile" 
  on public.user_profiles for insert 
  with check (auth.uid() = id);

create index if not exists idx_user_profiles_email on public.user_profiles(email);
create index if not exists idx_user_profiles_user_type on public.user_profiles(user_type);
create index if not exists idx_user_profiles_created_at on public.user_profiles(created_at);

create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.user_profiles (id, email, full_name, user_type, email_verified)
  values (
    new.id, 
    new.email, 
    coalesce(new.raw_user_meta_data->>'full_name', 'User'),
    coalesce(new.raw_user_meta_data->>'user_type', 'student'),
    new.email_confirmed_at is not null
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.handle_user_email_verification() 
returns trigger as $$
begin
  if new.email_confirmed_at is not null and old.email_confirmed_at is null then
    update public.user_profiles 
    set email_verified = true, updated_at = now()
    where id = new.id;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_email_verified on auth.users;
create trigger on_auth_user_email_verified
  after update on auth.users
  for each row execute procedure public.handle_user_email_verification();

grant usage on schema public to anon, authenticated;
grant all on public.user_profiles to anon, authenticated;

create or replace view public.public_profiles as
  select 
    id,
    full_name,
    user_type,
    avatar_url,
    created_at
  from public.user_profiles;

grant select on public.public_profiles to anon, authenticated;
