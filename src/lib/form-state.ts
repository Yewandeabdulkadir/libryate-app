import type { FieldErrors } from "@/lib/validation";

/** What a form's server action sends back to the page: field errors, a message, and what was typed. */
export type FormState = {
  errors?: FieldErrors;
  message?: string;
  ok?: boolean;
  values?: Record<string, string>;
};

export const initialFormState: FormState = {};

/** Keep what the person typed (except passwords) so a failed submit does not clear the form. */
export function keepValues(form: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of form.entries()) {
    if (typeof value === "string" && !/password|confirm/i.test(key)) out[key] = value;
  }
  return out;
}
