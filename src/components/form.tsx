"use client";

import { useFormStatus } from "react-dom";
import type { FormState } from "@/lib/form-state";

export function SubmitButton({ children, pendingText }: { children: React.ReactNode; pendingText?: string }) {
  const { pending } = useFormStatus();
  return (
    <button className="btn block" type="submit" disabled={pending} aria-disabled={pending}>
      {pending ? (pendingText ?? "Please wait…") : children}
    </button>
  );
}

type FieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  name: string;
  state?: FormState;
  hint?: string;
};

/** A labelled input that shows its error underneath and keeps what was typed. */
export function Field({ label, name, state, hint, defaultValue, ...rest }: FieldProps) {
  const error = state?.errors?.[name];
  const id = `f-${name}`;
  return (
    <label className="field" htmlFor={id}>
      {label}
      <input
        id={id}
        name={name}
        defaultValue={state?.values?.[name] ?? defaultValue}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
        {...rest}
      />
      {hint && !error && (
        <span id={`${id}-hint`} className="hint">
          {hint}
        </span>
      )}
      {error && (
        <span id={`${id}-err`} className="err" role="alert">
          {error}
        </span>
      )}
    </label>
  );
}

export function FormMessage({ state }: { state: FormState }) {
  if (!state.message) return null;
  return (
    <p className={`banner ${state.ok ? "ok" : "bad"}`} role={state.ok ? "status" : "alert"}>
      {state.message}
    </p>
  );
}
