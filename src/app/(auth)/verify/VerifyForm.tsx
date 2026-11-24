"use client";

import { useActionState } from "react";
import { Field, FormMessage, SubmitButton } from "@/components/form";
import { initialFormState } from "@/lib/form-state";
import { resendCode, verifyCode } from "../actions";

export function VerifyForm({ email, purpose, next }: { email: string; purpose: "signup" | "recovery"; next?: string }) {
  const [state, action] = useActionState(verifyCode, initialFormState);
  const [resent, resend, resending] = useActionState(resendCode, initialFormState);
  return (
    <>
      <form action={action} className="fform" noValidate>
        <FormMessage state={state} />
        <input type="hidden" name="email" value={email} />
        <input type="hidden" name="purpose" value={purpose} />
        {next && <input type="hidden" name="next" value={next} />}
        <Field
          label="Code"
          name="token"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]*"
          maxLength={10}
          required
          state={state}
          style={{ letterSpacing: ".3em", fontSize: 20, fontWeight: 700 }}
        />
        <SubmitButton pendingText="Checking…">Continue</SubmitButton>
      </form>
      <form action={resend} className="stack-s">
        <FormMessage state={resent} />
        <input type="hidden" name="email" value={email} />
        <input type="hidden" name="purpose" value={purpose} />
        <button className="link" type="submit" disabled={resending} style={{ alignSelf: "center" }}>
          {resending ? "Sending…" : "Send a new code"}
        </button>
      </form>
    </>
  );
}
