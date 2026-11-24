import { redirect } from "next/navigation";
import { cache } from "react";
import type { Profile, UserRole } from "@/lib/database.types";
import { homeFor } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";

/** The logged-in user's profile, or null. Cached for the length of one request. */
export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  return data;
});

/**
 * Use at the top of a private page. Sends people to log in, to the suspended notice,
 * or to their own home page if the page is not for their role.
 * (This is for a good experience. The database's own rules are what actually protect the data.)
 */
export async function requireProfile(roles?: UserRole[]): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.status === "suspended") redirect("/suspended");
  if (roles && !roles.includes(profile.role)) redirect(homeFor(profile.role));
  return profile;
}
