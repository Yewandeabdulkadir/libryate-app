# Developer runbook

## Local setup

```bash
npm install
cp .env.example .env.local     # add the staging project URL and anon key
npm run dev
```

## Apply the database to a Supabase project

```bash
npx supabase login
npx supabase link --project-ref <project-ref>     # the code in the project URL
npx supabase db push                               # applies supabase/migrations in order
```

For a demo or staging project only, load the sample books: paste `supabase/seed.sql` into the Supabase SQL editor and
run it. **Never load the seed into production.**

## Supabase dashboard settings

1. **Authentication → Sign In / Providers → Email**: keep *Confirm email* on. Set *Email OTP expiration* to 3600
   seconds or less (US02: codes expire).
2. **Authentication → URL Configuration**: set *Site URL* to the deployed address, and add
   `https://<your-domain>/**` and `https://*-<vercel-team>.vercel.app/**` to *Redirect URLs*.
3. **Authentication → Email Templates**: the app asks people to type a 6-digit code (it works even when the email
   opens in a different browser from the app). Add the code to both templates:
   - *Confirm signup*: `<p>Your Libryate code is <strong>{{ .Token }}</strong></p>` and keep the link as a fallback,
     changed to `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email`.
   - *Reset password*: `<p>Your reset code is <strong>{{ .Token }}</strong></p>`, link
     `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery`.
4. **Authentication → SMTP**: before real users, connect a proper email sender (for example Resend or Postmark).
   The built-in sender is limited to a few emails per hour and is for testing only.
5. **Authentication → Attack protection**: turn on leaked password protection (Pro plan) and CAPTCHA before launch.

## Create the first admin

Nobody can make themselves an admin from the app. After the person has signed up normally, run this once in the
Supabase SQL editor:

```sql
update public.profiles set role = 'admin' where email = 'person@company.com';
```

From then on, admins can manage other accounts in the app (`/admin`), and every change is written to
`admin_audit_log`.

## Running the database tests locally

The database tests need an empty Postgres database they are allowed to wipe:

```bash
createdb libryate_test
TEST_DATABASE_URL=postgres://postgres@localhost:5432/libryate_test npm run test:db
```

They load a small stand-in for Supabase's `auth` and `storage` schemas (`tests/db/supabase-stub.sql`), apply every
migration, load the seed, then check each access rule as a student, an author, an admin and a logged-out visitor.

## Making database changes

Add a new file in `supabase/migrations/` named `<timestamp>_<what>.sql`. Never edit a migration that has already been
applied to staging or production. Add tests in `tests/db/` for any new access rule. Update
`src/lib/database.types.ts`, or regenerate it with `npx supabase gen types typescript --project-id <ref>`.
