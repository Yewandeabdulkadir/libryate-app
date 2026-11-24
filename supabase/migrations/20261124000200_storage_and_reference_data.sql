-- Storage buckets for book covers and book files, plus reference data
-- (the five Law School subjects and the settings that are still to be decided).

-- ---------------------------------------------------------------------------
-- Storage
--   book-covers: public images, so covers load fast and cache well on slow networks.
--   book-files:  PRIVATE. The PDF/ePub files are never publicly reachable. Students will read
--                them only through the secure reader (Sprint 2).
-- Files go in a folder named after the uploader's user id, e.g. book-files/<user id>/<file>.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('book-covers', 'book-covers', true, 2 * 1024 * 1024, array['image/jpeg', 'image/png', 'image/webp']),
  ('book-files', 'book-files', false, 100 * 1024 * 1024, array['application/pdf', 'application/epub+zip'])
on conflict (id) do nothing;

-- Is the current user an approved, active author?
create or replace function public.is_approved_author()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.author_profiles ap
    join public.profiles p on p.id = ap.user_id
    where ap.user_id = auth.uid() and ap.approval_status = 'approved'
      and p.status = 'active' and p.role = 'author'
  );
$$;

create policy "Anyone can view book covers" on storage.objects
  for select using (bucket_id = 'book-covers');

create policy "Admins and approved authors upload covers" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'book-covers'
    and (public.is_admin()
         or (public.is_approved_author() and (storage.foldername(name))[1] = auth.uid()::text))
  );

create policy "Admins and owners replace covers" on storage.objects
  for update to authenticated
  using (bucket_id = 'book-covers'
         and (public.is_admin() or (storage.foldername(name))[1] = auth.uid()::text));

create policy "Admins and owners delete covers" on storage.objects
  for delete to authenticated
  using (bucket_id = 'book-covers'
         and (public.is_admin() or (storage.foldername(name))[1] = auth.uid()::text));

create policy "Admins and approved authors upload book files" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'book-files'
    and (public.is_admin()
         or (public.is_approved_author() and (storage.foldername(name))[1] = auth.uid()::text))
  );

-- Only admins (to review) and the uploading author can read the raw file. Students cannot.
create policy "Admins and owners read book files" on storage.objects
  for select to authenticated
  using (bucket_id = 'book-files'
         and (public.is_admin() or (storage.foldername(name))[1] = auth.uid()::text));

create policy "Admins delete book files" on storage.objects
  for delete to authenticated
  using (bucket_id = 'book-files' and public.is_admin());

-- ---------------------------------------------------------------------------
-- Subjects (US05): the five Nigerian Law School subjects, with the colours from the Figma design.
-- ---------------------------------------------------------------------------

insert into public.subjects (id, name, color, sort_order, description) values
  ('civil-litigation', 'Civil Litigation', '#1F5C4A', 1, 'Procedure in civil matters, from instructions to judgment and appeal.'),
  ('criminal-litigation', 'Criminal Litigation', '#7A2E2E', 2, 'Arrest, bail, charges, trial and appeal.'),
  ('property-law', 'Property Law Practice', '#34497A', 3, 'Land transactions, conveyancing, leases and mortgages.'),
  ('corporate-law', 'Corporate Law Practice', '#6B5426', 4, 'Company formation, governance, securities and insolvency.'),
  ('professional-ethics', 'Professional Ethics and Skills', '#4A3D6B', 5, 'Rules of professional conduct, advocacy and legal skills.')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Settings that are NOT decided yet. They are placeholders so the app can run.
-- Change them in the Supabase table editor (app_settings) once the business decides.
-- ---------------------------------------------------------------------------

insert into public.app_settings (key, value, description) values
  ('free_trial_days', '7'::jsonb,
   'Length of the free trial in days (US13).'),
  ('trial_reminder_days_before_end', '2'::jsonb,
   'Send the trial reminder this many days before it ends (US13).'),
  ('renewal_reminder_days_before_end', '[3, 0]'::jsonb,
   'Send renewal reminders this many days before the plan ends; 0 = last day (US15).'),
  ('pricing', jsonb_build_object(
      'decided', false,
      'currency', 'NGN',
      'note', 'PLACEHOLDER from the project brief. Pricing is an open decision.',
      'plans', jsonb_build_array(
        jsonb_build_object('id', 'day', 'name', 'Daily pass', 'days', 1, 'price_kobo', 25000),
        jsonb_build_object('id', 'week', 'name', 'Weekly pass', 'days', 7, 'price_kobo', 100000),
        jsonb_build_object('id', 'standard-monthly', 'name', 'Standard monthly', 'days', 30, 'price_kobo', 350000),
        jsonb_build_object('id', 'standard-yearly', 'name', 'Standard yearly', 'days', 365, 'price_kobo', 3850000)
      )),
   'Plans and prices. Amounts are in kobo (100 kobo = 1 naira), as Paystack expects.'),
  ('revenue_split', jsonb_build_object(
      'decided', false,
      'author_pool_percent', null,
      'note', 'Open decision: share of subscription revenue paid to authors each month (US25).'),
   'Author royalty pool as a percentage of monthly subscription revenue.'),
  ('copy_limit_words_per_day', '200'::jsonb,
   'Most words a reader can copy from books per day (US27). Placeholder.')
on conflict (key) do nothing;
