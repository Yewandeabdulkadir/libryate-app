# Libryate

Your library on the go. A mobile-first digital library for Nigerian Law School students, with a repository for authors.

This repository holds the real app that replaces the clickable prototype. It is built in two-week sprints, following the
[product backlog](https://docs.google.com/spreadsheets/d/13itQ-OySCMoU0P4z06UfbIY-yeyd5Us3lH2fQuFZ5RQ) (stories US01 to US29).

## What is built so far

| Sprint | Backlog stories | Status |
| --- | --- | --- |
| 0/1: Foundations, accounts, catalogue | US01, US02, US03, US04, US05, US06, admin side of US22 and US23 | **Built** |
| 2: Secure reader, shelf, notes, highlights | US07 to US12 | Next |
| 3: Subscriptions with Paystack, trial, reminders | US13 to US17 | Planned |
| 4: Author upload, admin approval, reading time, royalties | US18 to US25 | Planned |
| 5: Security, copy protection, NDPA, testing | US26 to US29 | Planned |

## How it fits together (plain language)

- **The app** is a website built for phones first (Next.js). Students open it in their phone browser and can add it to
  their home screen. The same code can later be wrapped for the app stores.
- **Supabase** is the back office. It holds the database (users, books, subjects), handles logins and password resets,
  and stores book files and covers.
- **The database guards itself.** Every table has access rules (Row Level Security). Even if someone tampers with the
  app, the database refuses to show unpublished books to students, to let anyone make themselves an admin, or to let
  students download raw book files.
- **Undecided business choices** (prices, revenue split, trial length, copy limit) live in a settings table, not in
  the code, so they can change without a new release. They are clearly marked as placeholders today.

More detail: [docs/architecture.md](docs/architecture.md).

## For the delivery manager

- Accounts to create, step by step: [docs/setup-accounts.md](docs/setup-accounts.md)
- Decisions still open and where they plug in: [docs/decisions.md](docs/decisions.md)

## For the developer

- Running it, deploying it, and creating the first admin: [docs/runbook.md](docs/runbook.md)

Quick start:

```bash
npm install
cp .env.example .env.local   # fill in your Supabase URL and anon key
npm run dev                  # http://localhost:3000
```

Checks (all run automatically on every pull request):

```bash
npm run lint
npm run typecheck
npm test                     # unit tests; database tests too when TEST_DATABASE_URL is set
npm run build
```
