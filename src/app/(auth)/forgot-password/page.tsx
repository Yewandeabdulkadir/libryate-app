"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Field, FormMessage, SubmitButton } from "@/components/form";
import { initialFormState } from "@/lib/form-state";
import { requestPasswordReset } from "../actions";

export default function ForgotPassword() {
  const [state, action] = useActionState(requestPasswordReset, initialFormState);
  return (
    <>
      <h1 className="fh">Forgot your password?</h1>
      <p className="fsub muted">Enter your email and we will send you a code to set a new one.</p>
      <form action={action} className="fform" noValidate>
        <FormMessage state={state} />
        <Field label="Email" name="email" type="email" autoComplete="email" inputMode="email" required state={state} />
        <SubmitButton pendingText="Sending…">Send code</SubmitButton>
        <Link href="/login" className="small" style={{ textAlign: "center" }}>
          Back to log in
        </Link>
      </form>
    </>
  );
}
