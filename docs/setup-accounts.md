# Accounts to create (for the delivery manager)

Create every account **in the company's name**, with a shared company email (for example `tech@libryate.com`), not a
personal one. Turn on two-factor login for each. Store passwords in a password manager the company controls.

You only need **steps 1 and 2** to try the app. Steps 3 to 5 are needed later and can run in parallel.

---

## 1. Supabase (database, logins, file storage): about 15 minutes. Needed now.

1. Go to <https://supabase.com> and click **Start your project**. Sign up with the company email.
2. Create an **organization** called `Libryate`. Choose the **Free** plan for now.
3. Click **New project**:
   - Name: `libryate-staging` (we will make a separate `libryate-production` before launch).
   - Database password: click **Generate**, and save it in the password manager.
   - Region: **West EU (London)** or **Central EU (Frankfurt)**, the closest to Nigeria. (Supabase has no African region yet.)
4. Wait about two minutes for it to start.
5. Go to **Project Settings → API** and copy two values into the password manager:
   - **Project URL** (looks like `https://abcd1234.supabase.co`)
   - **anon public** key (a long code starting `eyJ`). This one is safe to share with the developer.
   - Do **not** share the `service_role` key in chat or email. Only the developer should copy it, directly from Supabase.
6. Go to **Organization → Team** and invite the developer as a **Developer** (or Admin if they will manage billing).

That is all you need to do in Supabase. The developer then applies the database (see `docs/runbook.md`).

## 2. Vercel (hosting the app): about 10 minutes. Needed now.

1. Go to <https://vercel.com/signup> and sign up **with the company's GitHub account**.
2. Click **Add New → Project**, choose the `libryate-app` repository, and click **Import**.
3. Before clicking Deploy, open **Environment Variables** and add:
   - `NEXT_PUBLIC_SUPABASE_URL` = the Project URL from step 1
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = the anon public key from step 1
   - `NEXT_PUBLIC_SITE_URL` = leave for now; the developer fills it in after the first deploy
4. Click **Deploy**. You get a link like `libryate-app.vercel.app`. Every pull request will also get its own preview link.
5. The free **Hobby** plan is fine for testing. Before launch, move to **Pro** (about US$20 per month per member),
   because Hobby is for non-commercial use only.

## 3. Paystack (payments): needed for Sprint 3. Start now, approval takes days.

1. Go to <https://dashboard.paystack.com/#/signup> and sign up with the company email.
2. Fill in the business details and upload the **CAC registration documents** and director ID.
3. You can use **test mode** straight away, before approval. In **Settings → API Keys & Webhooks**, the developer
   needs the **test public key** and **test secret key**. Invite the developer under **Settings → Team** rather than
   sending keys.

## 4. A domain name: needed before launch.

Buy `libryate.com` (or `.com.ng`) from a registrar such as Namecheap, Cloudflare or a `.ng` registrar. Give the developer
access to the DNS settings so they can point it at Vercel and set up email sending.

## 5. App store accounts: needed only if we publish to the app stores.

- **Google Play Console**: <https://play.google.com/console/signup>, one-off US$25, as an **organization** (needs a
  D-U-N-S number for the company; apply early, it is free but slow).
- **Apple Developer Program**: <https://developer.apple.com/programs/enroll/>, US$99 per year, as an **organization**
  (also needs the D-U-N-S number).

---

## Costs at a glance (approximate, check current prices)

| Service | Now (testing) | At launch |
| --- | --- | --- |
| Supabase | Free | Pro, about US$25 per month |
| Vercel | Free | Pro, about US$20 per member per month |
| Paystack | Free; fee per transaction | 1.5% + ₦100 per local payment (₦100 waived under ₦2,500), capped at ₦2,000 |
| Domain | | About US$10 to US$15 per year |
| SMS for phone sign-up (optional) | | Pay per message |
| Google Play / Apple | | US$25 once / US$99 per year |
