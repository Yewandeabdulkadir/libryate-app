-- Libryate foundation: accounts, roles, subjects, the book catalogue and the admin audit log.
--
-- Security model in one paragraph:
--   Every table has Row Level Security (RLS) switched on. The browser talks to the database
--   directly with the user's login token, so these policies ARE the access rules.
--   Students see published books. Authors also see their own books in any state.
--   Admins see and manage everything. Nobody can make themselves an admin from the app:
--   the admin role can only be granted by someone who already has database access
--   (see docs/runbook.md).

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------

create type public.user_role as enum ('student', 'author', 'admin');
create type public.account_status as enum ('active', 'suspended');
create type public.author_status as enum ('pending', 'approved', 'rejected');
create type public.book_status as enum ('draft', 'pending_review', 'published', 'rejected', 'unpublished');

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Profiles: one row per login, created automatically when someone signs up.
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null default 'student',
  status public.account_status not null default 'active',
  full_name text not null default '' check (char_length(full_name) <= 120),
  email text,
  phone text check (phone is null or phone ~ '^\+?[0-9]{7,15}$'),
  -- US03: institution, course and level, so we can show the most relevant books.
  institution text check (institution is null or char_length(institution) <= 120),
  course text check (course is null or char_length(course) <= 120),
  level text check (level is null or char_length(level) <= 60),
  -- US29 (NDPA 2023): when the person agreed to the terms and privacy notice.
  consent_accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'One row per user. role and status can only be changed by an admin.';

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Is the current user an active admin? SECURITY DEFINER so policies on profiles can call it
-- without recursing into themselves.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and status = 'active'
  );
$$;

create or replace function public.current_role_name()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid() and status = 'active';
$$;

-- ---------------------------------------------------------------------------
-- Author profiles: extra details for authors, approved by an admin (US18).
-- Bank and payout details are deliberately NOT here yet. They arrive in Sprint 4,
-- in a separate table that only the author and admins can read.
-- ---------------------------------------------------------------------------

create table public.author_profiles (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  pen_name text check (pen_name is null or char_length(pen_name) <= 120),
  bio text check (bio is null or char_length(bio) <= 2000),
  approval_status public.author_status not null default 'pending',
  rejection_reason text,
  reviewed_by uuid references public.profiles (id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger author_profiles_set_updated_at
  before update on public.author_profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- New sign-ups: create the profile (and author profile) from the sign-up form.
-- Only 'student' or 'author' can be chosen at sign-up. Anything else becomes 'student'.
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  requested text := meta ->> 'role';
  chosen public.user_role := case when requested = 'author' then 'author'::public.user_role
                                  else 'student'::public.user_role end;
begin
  insert into public.profiles (id, role, full_name, email, phone, institution, course, level, consent_accepted_at)
  values (
    new.id,
    chosen,
    left(coalesce(meta ->> 'full_name', ''), 120),
    new.email,
    nullif(new.phone, ''),
    nullif(left(meta ->> 'institution', 120), ''),
    nullif(left(meta ->> 'course', 120), ''),
    nullif(left(meta ->> 'level', 60), ''),
    case when (meta ->> 'consent') = 'true' then now() end
  );

  if chosen = 'author' then
    insert into public.author_profiles (user_id) values (new.id);
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Users may edit their own name and study details, but never their role, status or email.
-- Column-level privileges enforce this even if a policy would allow the row.
revoke update on public.profiles from authenticated, anon;
grant update (full_name, phone, institution, course, level) on public.profiles to authenticated;

revoke update on public.author_profiles from authenticated, anon;
grant update (pen_name, bio) on public.author_profiles to authenticated;

-- Admins change role/status/approval through these functions, which also write the audit log.

-- ---------------------------------------------------------------------------
-- Admin audit log (US23: every change to an account is logged).
-- ---------------------------------------------------------------------------

create table public.admin_audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles (id),
  action text not null,
  target_table text not null,
  target_id text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index admin_audit_log_target_idx on public.admin_audit_log (target_table, target_id);

-- ---------------------------------------------------------------------------
-- Subjects: the five Nigerian Law School subjects, editable by admins later.
-- ---------------------------------------------------------------------------

create table public.subjects (
  id text primary key check (id ~ '^[a-z0-9-]{2,40}$'),
  name text not null unique,
  description text,
  color text not null default '#1F4BA5' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- array_to_string is not marked immutable, so a generated column cannot call it directly.
create or replace function public.keywords_to_text(words text[])
returns text
language sql
immutable
parallel safe
as $$ select coalesce(array_to_string(words, ' '), '') $$;

-- ---------------------------------------------------------------------------
-- Books: the catalogue (US04, US05, US06). Authors upload in Sprint 4; admins publish.
-- ---------------------------------------------------------------------------

create table public.books (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 200),
  -- The name shown on the book. Not every author will have a Libryate account at launch.
  author_name text not null check (char_length(author_name) between 1 and 160),
  author_id uuid references public.profiles (id) on delete set null,
  edition text check (edition is null or char_length(edition) <= 60),
  subject_id text not null references public.subjects (id),
  description text not null default '' check (char_length(description) <= 5000),
  keywords text[] not null default '{}',
  isbn text check (isbn is null or isbn ~ '^[0-9Xx-]{10,17}$'),
  page_count int check (page_count is null or page_count > 0),
  -- Path inside the public 'book-covers' storage bucket.
  cover_path text,
  -- Path inside the PRIVATE 'book-files' storage bucket. Never sent to the browser directly;
  -- the secure reader (Sprint 2) serves pages through short-lived, checked links.
  file_path text,
  status public.book_status not null default 'draft',
  rejection_reason text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Text used for search: title, author, keywords and description.
  search_text tsvector generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(author_name, '')), 'A') ||
    setweight(to_tsvector('english', public.keywords_to_text(keywords)), 'B') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'C')
  ) stored
);

create index books_subject_status_idx on public.books (subject_id, status);
create index books_author_idx on public.books (author_id);
create index books_search_idx on public.books using gin (search_text);

create trigger books_set_updated_at
  before update on public.books
  for each row execute function public.set_updated_at();

-- Keep published_at in step with status.
create or replace function public.books_track_publish()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'published' and (tg_op = 'INSERT' or old.status is distinct from 'published') then
    new.published_at := now();
  end if;
  return new;
end;
$$;

create trigger books_track_publish
  before insert or update of status on public.books
  for each row execute function public.books_track_publish();

-- Authors may never publish their own books: only admins can set status to 'published'
-- or 'rejected' (US22). This check runs whatever the policies allow.
create or replace function public.books_guard_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_admin() or auth.uid() is null then
    -- Admins, and trusted server-side jobs that use the service key, are not limited here.
    return new;
  end if;

  if new.status not in ('draft', 'pending_review') then
    raise exception 'Only an admin can publish or reject a book' using errcode = '42501';
  end if;

  if tg_op = 'UPDATE' and old.status not in ('draft', 'pending_review', 'rejected') then
    raise exception 'A published book can only be changed by an admin' using errcode = '42501';
  end if;

  -- An author cannot hand a book to someone else.
  if new.author_id is distinct from auth.uid() then
    raise exception 'Authors can only manage their own books' using errcode = '42501';
  end if;

  new.rejection_reason := case when tg_op = 'UPDATE' then old.rejection_reason else null end;
  return new;
end;
$$;

create trigger books_guard_status
  before insert or update on public.books
  for each row execute function public.books_guard_status();

-- ---------------------------------------------------------------------------
-- Search (US04): at least 2 characters, matches title, author, subject or keyword.
-- SECURITY INVOKER, so the normal access rules (RLS) still decide which books come back.
-- ---------------------------------------------------------------------------

create or replace function public.search_books(q text, subject text default null, max_results int default 30)
returns setof public.books
language sql
stable
security invoker
set search_path = public
as $$
  with term as (
    select btrim(q) as raw,
           '%' || replace(replace(replace(btrim(q), '\', '\\'), '%', '\%'), '_', '\_') || '%' as pattern,
           websearch_to_tsquery('english', btrim(q)) as tsq
  )
  select b.*
  from public.books b
  join public.subjects s on s.id = b.subject_id
  cross join term t
  where char_length(t.raw) >= 2
    and b.status = 'published'
    and (subject is null or b.subject_id = subject)
    and (
      b.search_text @@ t.tsq
      or b.title ilike t.pattern
      or b.author_name ilike t.pattern
      or s.name ilike t.pattern
      or exists (select 1 from unnest(b.keywords) k where k ilike t.pattern)
    )
  order by ts_rank(b.search_text, t.tsq) desc, b.title
  limit least(greatest(coalesce(max_results, 30), 1), 100);
$$;

-- ---------------------------------------------------------------------------
-- App settings: values the business has not decided yet (pricing, revenue split)
-- live here, not in code, so they can change without a new release.
-- ---------------------------------------------------------------------------

create table public.app_settings (
  key text primary key,
  value jsonb not null,
  description text,
  updated_by uuid references public.profiles (id),
  updated_at timestamptz not null default now()
);

create trigger app_settings_set_updated_at
  before update on public.app_settings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Admin actions (US22, US23). Each one checks the caller is an admin and writes the audit log.
-- ---------------------------------------------------------------------------

create or replace function public.admin_set_account_status(target uuid, new_status public.account_status, reason text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  previous public.account_status;
begin
  if not public.is_admin() then
    raise exception 'Admins only' using errcode = '42501';
  end if;
  if target = auth.uid() then
    raise exception 'You cannot change your own account status' using errcode = '42501';
  end if;

  select status into previous from public.profiles where id = target for update;
  if not found then
    raise exception 'No such user' using errcode = 'P0002';
  end if;

  update public.profiles set status = new_status where id = target;

  insert into public.admin_audit_log (actor_id, action, target_table, target_id, details)
  values (auth.uid(), 'set_account_status', 'profiles', target::text,
          jsonb_build_object('from', previous, 'to', new_status, 'reason', reason));
end;
$$;

create or replace function public.admin_set_role(target uuid, new_role public.user_role)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  previous public.user_role;
begin
  if not public.is_admin() then
    raise exception 'Admins only' using errcode = '42501';
  end if;
  if target = auth.uid() then
    raise exception 'You cannot change your own role' using errcode = '42501';
  end if;

  select role into previous from public.profiles where id = target for update;
  if not found then
    raise exception 'No such user' using errcode = 'P0002';
  end if;

  update public.profiles set role = new_role where id = target;
  if new_role = 'author' then
    insert into public.author_profiles (user_id) values (target) on conflict do nothing;
  end if;

  insert into public.admin_audit_log (actor_id, action, target_table, target_id, details)
  values (auth.uid(), 'set_role', 'profiles', target::text,
          jsonb_build_object('from', previous, 'to', new_role));
end;
$$;

create or replace function public.admin_review_author(target uuid, decision public.author_status, reason text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Admins only' using errcode = '42501';
  end if;
  if decision = 'rejected' and coalesce(btrim(reason), '') = '' then
    raise exception 'Give a reason when rejecting an author' using errcode = '22023';
  end if;

  update public.author_profiles
     set approval_status = decision,
         rejection_reason = case when decision = 'rejected' then reason end,
         reviewed_by = auth.uid(),
         reviewed_at = now()
   where user_id = target;
  if not found then
    raise exception 'No such author' using errcode = 'P0002';
  end if;

  insert into public.admin_audit_log (actor_id, action, target_table, target_id, details)
  values (auth.uid(), 'review_author', 'author_profiles', target::text,
          jsonb_build_object('decision', decision, 'reason', reason));
end;
$$;

create or replace function public.admin_review_book(target uuid, decision public.book_status, reason text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  previous public.book_status;
begin
  if not public.is_admin() then
    raise exception 'Admins only' using errcode = '42501';
  end if;
  if decision not in ('published', 'rejected', 'unpublished') then
    raise exception 'A review must publish, reject or unpublish' using errcode = '22023';
  end if;
  if decision = 'rejected' and coalesce(btrim(reason), '') = '' then
    raise exception 'Give a reason when rejecting a book' using errcode = '22023';
  end if;

  select status into previous from public.books where id = target for update;
  if not found then
    raise exception 'No such book' using errcode = 'P0002';
  end if;

  update public.books
     set status = decision,
         rejection_reason = case when decision = 'rejected' then reason end
   where id = target;

  insert into public.admin_audit_log (actor_id, action, target_table, target_id, details)
  values (auth.uid(), 'review_book', 'books', target::text,
          jsonb_build_object('from', previous, 'to', decision, 'reason', reason));
end;
$$;

-- Only signed-in users may call these. The functions themselves check for admin.
revoke execute on function public.admin_set_account_status(uuid, public.account_status, text) from public, anon;
revoke execute on function public.admin_set_role(uuid, public.user_role) from public, anon;
revoke execute on function public.admin_review_author(uuid, public.author_status, text) from public, anon;
revoke execute on function public.admin_review_book(uuid, public.book_status, text) from public, anon;
grant execute on function public.admin_set_account_status(uuid, public.account_status, text) to authenticated;
grant execute on function public.admin_set_role(uuid, public.user_role) to authenticated;
grant execute on function public.admin_review_author(uuid, public.author_status, text) to authenticated;
grant execute on function public.admin_review_book(uuid, public.book_status, text) to authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.author_profiles enable row level security;
alter table public.admin_audit_log enable row level security;
alter table public.subjects enable row level security;
alter table public.books enable row level security;
alter table public.app_settings enable row level security;

-- profiles
create policy "Users read their own profile" on public.profiles
  for select to authenticated using (id = auth.uid());
create policy "Admins read all profiles" on public.profiles
  for select to authenticated using (public.is_admin());
create policy "Users update their own profile" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- author_profiles
create policy "Authors read their own author profile" on public.author_profiles
  for select to authenticated using (user_id = auth.uid());
create policy "Admins read all author profiles" on public.author_profiles
  for select to authenticated using (public.is_admin());
create policy "Authors update their own author profile" on public.author_profiles
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- admin_audit_log: admins read it; rows are only written by the admin functions above.
create policy "Admins read the audit log" on public.admin_audit_log
  for select to authenticated using (public.is_admin());

-- subjects: everyone signed in can read; admins manage.
create policy "Signed-in users read subjects" on public.subjects
  for select to authenticated using (true);
create policy "Admins manage subjects" on public.subjects
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- books
create policy "Active users read published books" on public.books
  for select to authenticated
  using (status = 'published' and public.current_role_name() is not null);
create policy "Authors read their own books" on public.books
  for select to authenticated using (author_id = auth.uid());
create policy "Admins read all books" on public.books
  for select to authenticated using (public.is_admin());

create policy "Approved authors add their own books" on public.books
  for insert to authenticated
  with check (
    author_id = auth.uid()
    and exists (
      select 1 from public.author_profiles ap
      join public.profiles p on p.id = ap.user_id
      where ap.user_id = auth.uid() and ap.approval_status = 'approved' and p.status = 'active'
    )
  );
create policy "Authors edit their own unpublished books" on public.books
  for update to authenticated
  using (author_id = auth.uid() and status in ('draft', 'pending_review', 'rejected'))
  with check (author_id = auth.uid());
create policy "Authors delete their own drafts" on public.books
  for delete to authenticated using (author_id = auth.uid() and status = 'draft');
create policy "Admins manage all books" on public.books
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- app_settings: signed-in users can read (e.g. plan prices); admins change.
create policy "Signed-in users read settings" on public.app_settings
  for select to authenticated using (true);
create policy "Admins manage settings" on public.app_settings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Nothing is readable without logging in.
revoke all on all tables in schema public from anon;
