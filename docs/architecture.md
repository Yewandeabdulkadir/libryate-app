# Architecture

## Choices and why

| Need | Choice | Why |
| --- | --- | --- |
| Front end | **Next.js 15 (React), mobile-first web app** | One codebase for phones and desktops. Pages are rendered on the server, so phones download little JavaScript (important for students on small data plans, US28). Can be wrapped for the app stores later. |
| Database, logins, file storage | **Supabase** (managed Postgres, Auth, Storage) | One provider for the three things we need, with a free tier to start. Standard Postgres, so we are not locked in. Has a data region choice and signs a data processing agreement (NDPA). |
| Access control | **Postgres Row Level Security** | The rules live next to the data and apply to every request. They are covered by automated tests. |
| Payments (Sprint 3) | **Paystack** | Local cards, bank transfer and USSD (US14). Test mode first. |
| Hosting (suggested) | **Vercel** | Made by the Next.js team. Every pull request gets a preview link the team can click and test. |

## Data model (Sprint 1)

```
auth.users (managed by Supabase)
  └── profiles              one per user: role (student | author | admin), status, name, institution, course, level, consent time
        └── author_profiles  for authors: pen name, bio, approval status (pending | approved | rejected)
subjects                    the five Law School subjects
books                       title, author name, edition, subject, description, keywords, cover, file, status
                            status: draft → pending_review → published | rejected → unpublished
admin_audit_log             every admin action: who, what, when, before and after
app_settings                undecided values: pricing, revenue split, trial length, reminder days, copy limit
storage: book-covers        public images
storage: book-files         PRIVATE PDFs and ePubs, never downloadable by students
```

## Who can do what

| | Student | Author | Admin |
| --- | --- | --- | --- |
| Sign up as | yes | yes (then waits for approval) | no, granted by a developer or another admin |
| See published books | yes | yes | yes |
| See unpublished books | no | only their own | all |
| Add books | no | only when approved, only as draft or pending review | yes |
| Publish or reject books | no | no | yes, with a reason for rejections, logged |
| Suspend or reactivate users | no | no | yes, logged; cannot suspend themselves |
| Read raw book files | no | only their own uploads | yes |
| Change their own role or status | no | no | no |

Suspended users are logged out of the catalogue: the database stops returning books to them.

## Where to find things

```
src/app/(auth)/      welcome, sign-up, log in, code entry, password reset
src/app/(app)/       catalogue, search, subject pages, book details, profile, author and admin pages
src/lib/             Supabase connection, form rules, catalogue queries
supabase/migrations/ database structure and access rules (applied in order)
supabase/seed.sql    sample books for local testing only
tests/db/            tests that prove the access rules work, against a real Postgres
tests/unit/          tests for form rules and page routing
```
