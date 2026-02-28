-- Run this script in Supabase SQL Editor.
-- It creates the minimum tables and storage bucket needed by this app.

create table if not exists public.users (
  id text primary key,
  school text not null default '',
  email text not null unique,
  phone text not null default '',
  password_hash text not null,
  name text not null,
  created_at timestamptz not null default now()
);

create index if not exists users_email_idx on public.users (email);

create table if not exists public.handouts (
  id text primary key,
  user_id text not null references public.users(id) on delete cascade,
  filename text not null,
  course_title text not null,
  course_code text not null,
  summary jsonb not null default '[]'::jsonb,
  quiz jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists handouts_user_id_created_at_idx
  on public.handouts (user_id, created_at desc);

-- Storage bucket for uploaded PDFs.
-- Keep this bucket private because uploads/downloads happen on the server with service role key.
-- Ensure SUPABASE_STORAGE_BUCKET=handouts and SUPABASE_SERVICE_ROLE_KEY are set in Vercel/env;
-- a 403 on upload usually means the bucket is missing, the key is wrong, or the bucket name in env doesn't match.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('handouts', 'handouts', false, 10485760, array['application/pdf'])
on conflict (id) do nothing;

-- Allow inserts into handouts bucket (server uses service role; required so uploads work).
create policy "Allow handouts bucket insert"
on storage.objects for insert to public
with check (bucket_id = 'handouts');
