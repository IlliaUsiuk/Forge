-- Run this in Supabase Dashboard → SQL Editor

-- Main user data table (stores entire app state as JSONB)
create table if not exists user_data (
  id uuid references auth.users on delete cascade primary key,
  data jsonb not null default '{}',
  updated_at timestamptz default now()
);

-- Row Level Security: each user sees only their own data
alter table user_data enable row level security;

create policy "Users can read own data" on user_data
  for select using (auth.uid() = id);

create policy "Users can insert own data" on user_data
  for insert with check (auth.uid() = id);

create policy "Users can update own data" on user_data
  for update using (auth.uid() = id);

create policy "Users can delete own data" on user_data
  for delete using (auth.uid() = id);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger user_data_updated_at
  before update on user_data
  for each row execute function update_updated_at();

-- Weekly backups table (keeps last 8 snapshots per user)
create table if not exists user_data_backups (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  data jsonb not null,
  created_at timestamptz default now()
);

alter table user_data_backups enable row level security;

create policy "Users can read own backups" on user_data_backups
  for select using (auth.uid() = user_id);

create policy "Users can insert own backups" on user_data_backups
  for insert with check (auth.uid() = user_id);

create policy "Users can delete own backups" on user_data_backups
  for delete using (auth.uid() = user_id);
