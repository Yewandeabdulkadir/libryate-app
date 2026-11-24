"use client";

import { useActionState } from "react";
import { Field, FormMessage, SubmitButton } from "@/components/form";
import { initialFormState } from "@/lib/form-state";
import { setNewPassword } from "../actions";

export default function ResetPassword() {
  const [state, action] = useActionState(setNewPassword, initialFormState);
  return (
    <>
      <h1 className="fh">Choose a new password</h1>
      <form action={action} className="fform" noValidate>
        <FormMessage state={state} />
        <Field
          label="New password"
          name="password"
          type="password"
          autoComplete="new-password"
          hint="At least 8 characters, with a letter and a number."
          required
          state={state}
        />
        <Field label="Type it again" name="confirm" type="password" autoComplete="new-password" required state={state} />
        <SubmitButton pendingText="Saving…">Save password</SubmitButton>
      </form>
    </>
  );
}
