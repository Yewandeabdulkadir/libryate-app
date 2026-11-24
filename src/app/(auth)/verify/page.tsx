import { redirect } from "next/navigation";
import { VerifyForm } from "./VerifyForm";

export const metadata = { title: "Enter your code" };

export default async function Verify({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; purpose?: string; next?: string }>;
}) {
  const { email, purpose, next } = await searchParams;
  if (!email) redirect("/login");
  const recovery = purpose === "recovery";
  return (
    <>
      <h1 className="fh">{recovery ? "Reset your password" : "Confirm your email"}</h1>
      <p className="fsub">
        If there is an account for <strong>{email}</strong>, we have sent it a code. Enter it below, or tap the link in the
        email. The code expires after a short time.
      </p>
      <VerifyForm email={email} purpose={recovery ? "recovery" : "signup"} next={next} />
    </>
  );
}
