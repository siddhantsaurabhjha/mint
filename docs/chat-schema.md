# Supabase Chat + Media Schema (Paste into SQL Editor)

This schema supports a two-user private chat with read receipts, typing status, presence, reply-to, and future media/story/gallery/reminder support. It is optimized for a mobile PWA with lightweight indexes.

## Full SQL

```sql
-- Extensions
create extension if not exists pgcrypto;

-- Messages
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  room_id text not null,
  sender_id uuid not null,
  recipient_id uuid not null,
  sender_username text not null,
  body text,
  type text not null default 'text',
  reply_to uuid,
  reactions jsonb default '[]'::jsonb,
  media_url text,
  media_meta jsonb default '{}'::jsonb,
  delivered_at timestamptz,
  seen_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_room_created_idx
  on public.chat_messages (room_id, created_at);

create index if not exists chat_messages_reply_idx
  on public.chat_messages (reply_to);

alter table public.chat_messages
  add constraint chat_messages_type_check
  check (type in ('text', 'image', 'voice'));

alter table public.chat_messages
  add constraint chat_messages_reply_fk
  foreign key (reply_to) references public.chat_messages (id) on delete set null;

-- Read receipts (per user, per message)
create table if not exists public.chat_receipts (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.chat_messages (id) on delete cascade,
  user_id uuid not null,
  delivered_at timestamptz,
  seen_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists chat_receipts_message_idx
  on public.chat_receipts (message_id, user_id);

-- Typing status (kept lean, updated frequently)
create table if not exists public.chat_typing (
  id uuid primary key default gen_random_uuid(),
  room_id text not null,
  user_id uuid not null,
  username text not null,
  is_typing boolean not null default false,
  updated_at timestamptz not null default now()
);

create index if not exists chat_typing_room_idx
  on public.chat_typing (room_id, updated_at desc);

-- Online presence + last seen
create table if not exists public.user_presence (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  username text not null,
  is_online boolean not null default false,
  last_seen timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_presence_user_idx
  on public.user_presence (user_id);

-- Stories (future-ready)
create table if not exists public.stories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  username text not null,
  type text not null default 'image',
  media_url text,
  caption text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours')
);

alter table public.stories
  add constraint stories_type_check
  check (type in ('image', 'video', 'text'));

create index if not exists stories_user_created_idx
  on public.stories (user_id, created_at desc);

-- Gallery items (future-ready)
create table if not exists public.gallery_items (
  id uuid primary key default gen_random_uuid(),
  room_id text not null,
  owner_id uuid not null,
  type text not null default 'image',
  title text,
  media_url text,
  thumbnail_url text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.gallery_items
  add constraint gallery_items_type_check
  check (type in ('image', 'video', 'audio', 'note'));

create index if not exists gallery_items_room_created_idx
  on public.gallery_items (room_id, created_at desc);

-- Reminders (future-ready)
create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  room_id text not null,
  created_by uuid not null,
  title text not null,
  body text,
  remind_at timestamptz not null,
  status text not null default 'scheduled',
  created_at timestamptz not null default now()
);

alter table public.reminders
  add constraint reminders_status_check
  check (status in ('scheduled', 'sent', 'cancelled'));

create index if not exists reminders_room_time_idx
  on public.reminders (room_id, remind_at);

-- RLS
alter table public.chat_messages enable row level security;
alter table public.chat_receipts enable row level security;
alter table public.chat_typing enable row level security;
alter table public.user_presence enable row level security;
alter table public.stories enable row level security;
alter table public.gallery_items enable row level security;
alter table public.reminders enable row level security;

create policy "chat_messages_read" on public.chat_messages
  for select using (
    auth.role() = 'authenticated'
    and (auth.jwt() ->> 'email') in ('sid@mail.com', 'laxu@mail.com')
  );

create policy "chat_messages_insert" on public.chat_messages
  for insert with check (
    auth.role() = 'authenticated'
    and (auth.jwt() ->> 'email') in ('sid@mail.com', 'laxu@mail.com')
    and recipient_id is not null
  );

create policy "chat_messages_update" on public.chat_messages
  for update using (
    auth.role() = 'authenticated'
    and (auth.jwt() ->> 'email') in ('sid@mail.com', 'laxu@mail.com')
  );

-- Delete for everyone is handled as an update to a shared deleted placeholder so both devices stay in sync.

create policy "chat_receipts_access" on public.chat_receipts
  for all using (
    auth.role() = 'authenticated'
    and (auth.jwt() ->> 'email') in ('sid@mail.com', 'laxu@mail.com')
  ) with check (
    auth.role() = 'authenticated'
    and (auth.jwt() ->> 'email') in ('sid@mail.com', 'laxu@mail.com')
  );

create policy "chat_typing_access" on public.chat_typing
  for all using (
    auth.role() = 'authenticated'
    and (auth.jwt() ->> 'email') in ('sid@mail.com', 'laxu@mail.com')
  ) with check (
    auth.role() = 'authenticated'
    and (auth.jwt() ->> 'email') in ('sid@mail.com', 'laxu@mail.com')
  );

create policy "user_presence_access" on public.user_presence
  for all using (
    auth.role() = 'authenticated'
    and (auth.jwt() ->> 'email') in ('sid@mail.com', 'laxu@mail.com')
  ) with check (
    auth.role() = 'authenticated'
    and (auth.jwt() ->> 'email') in ('sid@mail.com', 'laxu@mail.com')
  );

create policy "stories_access" on public.stories
  for all using (
    auth.role() = 'authenticated'
    and (auth.jwt() ->> 'email') in ('sid@mail.com', 'laxu@mail.com')
  ) with check (
    auth.role() = 'authenticated'
    and (auth.jwt() ->> 'email') in ('sid@mail.com', 'laxu@mail.com')
  );

create policy "gallery_items_access" on public.gallery_items
  for all using (
    auth.role() = 'authenticated'
    and (auth.jwt() ->> 'email') in ('sid@mail.com', 'laxu@mail.com')
  ) with check (
    auth.role() = 'authenticated'
    and (auth.jwt() ->> 'email') in ('sid@mail.com', 'laxu@mail.com')
  );

create policy "reminders_access" on public.reminders
  for all using (
    auth.role() = 'authenticated'
    and (auth.jwt() ->> 'email') in ('sid@mail.com', 'laxu@mail.com')
  ) with check (
    auth.role() = 'authenticated'
    and (auth.jwt() ->> 'email') in ('sid@mail.com', 'laxu@mail.com')
  );

-- Realtime
alter table public.chat_messages replica identity full;
alter table public.chat_receipts replica identity full;
alter table public.chat_typing replica identity full;
alter table public.user_presence replica identity full;
alter table public.stories replica identity full;
alter table public.gallery_items replica identity full;
alter table public.reminders replica identity full;

alter publication supabase_realtime add table public.chat_messages;
alter publication supabase_realtime add table public.chat_receipts;
alter publication supabase_realtime add table public.chat_typing;
alter publication supabase_realtime add table public.user_presence;
alter publication supabase_realtime add table public.stories;
alter publication supabase_realtime add table public.gallery_items;
alter publication supabase_realtime add table public.reminders;
```
