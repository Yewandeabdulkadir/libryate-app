import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { homeFor } from "@/lib/routes";

export default async function Root() {
  const profile = await getCurrentProfile();
  redirect(profile ? homeFor(profile.role) : "/welcome");
}
