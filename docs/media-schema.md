# Phase 3 Media, Voice, Story, Gallery Schema

Paste this SQL into the Supabase SQL Editor to add media, voice, story, and gallery metadata. It complements docs/chat-schema.md.

```sql
alter table public.chat_messages
  add column if not exists media_public_id text,
  add column if not exists media_meta jsonb default '{}'::jsonb;

create table if not exists public.story_reactions (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories (id) on delete cascade,
  user_id uuid not null,
  reaction text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.story_comments (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories (id) on delete cascade,
  user_id uuid not null,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists story_reactions_story_idx
  on public.story_reactions (story_id, created_at);

create index if not exists story_comments_story_idx
  on public.story_comments (story_id, created_at);

alter table public.story_reactions enable row level security;
alter table public.story_comments enable row level security;

create policy "story_reactions_access" on public.story_reactions
  for all using (
    auth.role() = 'authenticated'
    and (auth.jwt() ->> 'email') in ('sid@mail.com', 'laxu@mail.com')
  ) with check (
    auth.role() = 'authenticated'
    and (auth.jwt() ->> 'email') in ('sid@mail.com', 'laxu@mail.com')
  );

create policy "story_comments_access" on public.story_comments
  for all using (
    auth.role() = 'authenticated'
    and (auth.jwt() ->> 'email') in ('sid@mail.com', 'laxu@mail.com')
  ) with check (
    auth.role() = 'authenticated'
    and (auth.jwt() ->> 'email') in ('sid@mail.com', 'laxu@mail.com')
  );

alter table public.story_reactions replica identity full;
alter table public.story_comments replica identity full;

alter publication supabase_realtime add table public.story_reactions;
alter publication supabase_realtime add table public.story_comments;
```

## Cloudinary env placeholders

Add to .env.local:

```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```
