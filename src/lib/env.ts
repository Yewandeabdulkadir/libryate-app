// Reads the settings the app needs, and fails with a clear message if one is missing.

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing setting ${name}. Copy .env.example to .env.local and fill it in (see docs/setup-accounts.md).`,
    );
  }
  return value;
}

export const env = {
  get supabaseUrl() {
    return required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL);
  },
  get supabaseAnonKey() {
    return required("NEXT_PUBLIC_SUPABASE_ANON_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  },
  get siteUrl() {
    return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  },
};
