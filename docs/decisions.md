# Open decisions and where they plug in

None of these block Sprint 1. Each has a safe placeholder so the app can run. Change the value in Supabase
(Table editor → `app_settings`) once decided. No code change or release is needed.

| Decision | Setting key | Placeholder today | Needed by |
| --- | --- | --- | --- |
| Plans and prices (US14, US17) | `pricing` | Daily ₦250, weekly ₦1,000, standard monthly ₦3,500, yearly ₦38,500, from the brief. Marked `"decided": false`. | Sprint 3 |
| Author revenue split (US25) | `revenue_split` | Empty (`author_pool_percent: null`) | Sprint 4 |
| Free trial length (US13) | `free_trial_days` | 7 | Sprint 3 |
| Reminder timing (US13, US15) | `trial_reminder_days_before_end`, `renewal_reminder_days_before_end` | 2 days; 3 days and last day | Sprint 3 |
| Copy limit per day (US27) | `copy_limit_words_per_day` | 200 words | Sprint 5 |

Other open points found while building Sprint 1:

1. **Sign up with phone number (US01).** Email sign-up is built. Phone sign-up needs an SMS provider account
   (for example Twilio or Termii) connected to Supabase, which costs money per SMS. Decide whether phone sign-up is
   needed at launch.
2. **Privacy notice wording (US29).** A placeholder is in the app at `/privacy`. The final text needs legal sign-off.
3. **"Email already in use" message (US01).** The backlog asks us to tell people when an email is taken. This also
   lets anyone check whether an email has an account. It is built as the backlog says; flag it if you would rather hide it.
4. **Repository visibility.** This GitHub repository is currently public. Consider making it private
   (Settings → General → Danger zone → Change visibility).
