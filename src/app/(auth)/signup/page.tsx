import { SignUpForm } from "./SignUpForm";

export const metadata = { title: "Create an account" };

export default async function SignUp({ searchParams }: { searchParams: Promise<{ role?: string }> }) {
  const { role } = await searchParams;
  return (
    <>
      <h1 className="fh">Create your account</h1>
      <p className="fsub muted">Start with a 7-day free trial. No card needed.</p>
      <SignUpForm initialRole={role === "author" ? "author" : "student"} />
    </>
  );
}
