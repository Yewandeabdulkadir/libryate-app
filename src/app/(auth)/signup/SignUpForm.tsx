"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Field, FormMessage, SubmitButton } from "@/components/form";
import { initialFormState } from "@/lib/form-state";
import { LAW_SCHOOL_CAMPUSES } from "@/lib/validation";
import { signUp } from "../actions";

export function SignUpForm({ initialRole }: { initialRole: "student" | "author" }) {
  const [state, action] = useActionState(signUp, initialFormState);
  const [role, setRole] = useState(state.values?.role ?? initialRole);

  return (
    <form action={action} className="fform" noValidate>
      <FormMessage state={state} />

      <fieldset className="segpick" style={{ border: 0, padding: 0, margin: 0 }}>
        <legend className="sr-only">I am joining as</legend>
        <label>
          <input type="radio" name="role" value="student" checked={role === "student"} onChange={() => setRole("student")} />
          Student
          <small>Read and study</small>
        </label>
        <label>
          <input type="radio" name="role" value="author" checked={role === "author"} onChange={() => setRole("author")} />
          Author
          <small>Publish my books</small>
        </label>
      </fieldset>

      <Field label="Full name" name="fullName" autoComplete="name" required state={state} />
      <Field label="Email" name="email" type="email" autoComplete="email" inputMode="email" required state={state} />
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        hint="At least 8 characters, with a letter and a number."
        state={state}
      />

      {role === "student" && (
        <>
          <Field
            label="Institution (optional)"
            name="institution"
            list="campuses"
            hint="So we can show the books for your campus. You can change this later."
            state={state}
          />
          <datalist id="campuses">
            {LAW_SCHOOL_CAMPUSES.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
          <Field label="Course (optional)" name="course" placeholder="e.g. Bar Part II" state={state} />
          <Field label="Level or session (optional)" name="level" placeholder="e.g. 2026/2027" state={state} />
        </>
      )}

      <label className="check">
        <input type="checkbox" name="consent" required aria-invalid={state.errors?.consent ? true : undefined} />
        <span>
          I agree to the terms and the <Link href="/privacy">privacy notice</Link>, and to Libryate using my details to run my
          account.
        </span>
      </label>
      {state.errors?.consent && (
        <span className="err" role="alert">
          {state.errors.consent}
        </span>
      )}

      <SubmitButton pendingText="Creating your account…">Create account</SubmitButton>
      <p className="small muted" style={{ textAlign: "center" }}>
        Already have an account? <Link href="/login">Log in</Link>
      </p>
    </form>
  );
}
