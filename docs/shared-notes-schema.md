# Shared Notes Supabase Schema

Paste this SQL into the Supabase SQL editor.

```sql
create extension if not exists pgcrypto;

create table if not exists public.shared_notes (
  id uuid primary key default gen_random_uuid(),
  room_id text not null,
  user_id uuid not null,
  username text not null,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists shared_notes_room_created_idx
  on public.shared_notes (room_id, created_at desc);

create index if not exists shared_notes_room_user_idx
  on public.shared_notes (room_id, user_id);

alter table public.shared_notes enable row level security;

create policy "shared_notes_read" on public.shared_notes
  for select using (
    auth.role() = 'authenticated'
    and (auth.jwt() ->> 'email') in ('sid@mail.com', 'laxu@mail.com')
  );

create policy "shared_notes_insert" on public.shared_notes
  for insert with check (
    auth.role() = 'authenticated'
    and (auth.jwt() ->> 'email') in ('sid@mail.com', 'laxu@mail.com')
  );

create policy "shared_notes_update" on public.shared_notes
  for update using (
    auth.role() = 'authenticated'
    and (auth.jwt() ->> 'email') in ('sid@mail.com', 'laxu@mail.com')
    and auth.uid() = user_id
  ) with check (
    auth.role() = 'authenticated'
    and (auth.jwt() ->> 'email') in ('sid@mail.com', 'laxu@mail.com')
    and auth.uid() = user_id
  );

create policy "shared_notes_delete" on public.shared_notes
  for delete using (
    auth.role() = 'authenticated'
    and (auth.jwt() ->> 'email') in ('sid@mail.com', 'laxu@mail.com')
    and auth.uid() = user_id
  );

alter table public.shared_notes replica identity full;

alter publication supabase_realtime add table public.shared_notes;
```