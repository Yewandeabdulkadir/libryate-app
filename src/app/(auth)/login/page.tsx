import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { homeFor } from "@/lib/routes";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Log in" };

export default async function Login({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const profile = await getCurrentProfile();
  if (profile) redirect(homeFor(profile.role));
  const { next, error } = await searchParams;
  return (
    <>
      <h1 className="fh">Welcome back</h1>
      <p className="fsub muted">Log in to carry on reading.</p>
      {error === "link" && (
        <p className="banner warn" role="alert">
          That email link has expired or was already used. Log in, or ask for a new code.
        </p>
      )}
      <LoginForm next={next} />
    </>
  );
}
