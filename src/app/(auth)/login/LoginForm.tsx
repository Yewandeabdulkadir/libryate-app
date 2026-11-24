"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Field, FormMessage, SubmitButton } from "@/components/form";
import { initialFormState } from "@/lib/form-state";
import { logIn } from "../actions";

export function LoginForm({ next }: { next?: string }) {
  const [state, action] = useActionState(logIn, initialFormState);
  return (
    <form action={action} className="fform" noValidate>
      <FormMessage state={state} />
      {next && <input type="hidden" name="next" value={next} />}
      <Field label="Email" name="email" type="email" autoComplete="email" inputMode="email" required state={state} />
      <Field label="Password" name="password" type="password" autoComplete="current-password" required state={state} />
      <Link href="/forgot-password" className="small" style={{ alignSelf: "flex-end" }}>
        Forgot password?
      </Link>
      <SubmitButton pendingText="Logging in…">Log in</SubmitButton>
      <p className="small muted" style={{ textAlign: "center" }}>
        New to Libryate? <Link href="/signup">Create an account</Link>
      </p>
    </form>
  );
}
