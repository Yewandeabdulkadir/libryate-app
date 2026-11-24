"use server";

import { redirect } from "next/navigation";
import { type FormState, keepValues } from "@/lib/form-state";
import { env } from "@/lib/env";
import { homeFor, safeNext } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";
import {
  emailOnlySchema,
  fieldErrors,
  logInSchema,
  newPasswordSchema,
  otpSchema,
  signUpSchema,
} from "@/lib/validation";

const verifyUrl = (email: string, purpose: "signup" | "recovery", next?: string) => {
  const params = new URLSearchParams({ email, purpose });
  if (next) params.set("next", next);
  return `/verify?${params.toString()}`;
};

/** US01: sign up with email and password. A confirmation code is emailed. */
export async function signUp(_prev: FormState, form: FormData): Promise<FormState> {
  const parsed = signUpSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values: keepValues(form) };
  const v = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: v.email,
    password: v.password,
    options: {
      emailRedirectTo: `${env.siteUrl}/auth/confirm`,
      // Read by the database when it creates the profile. The database ignores any role
      // other than student or author, so nobody can sign up as an admin.
      data: {
        role: v.role,
        full_name: v.fullName,
        institution: v.institution ?? null,
        course: v.course ?? null,
        level: v.level ?? null,
        consent: "true",
      },
    },
  });

  if (error) {
    if (/already registered|already exists/i.test(error.message)) return emailInUse(form);
    return { message: friendlyAuthError(error.message), values: keepValues(form) };
  }
  // With email confirmation on, Supabase hides whether an email is taken by returning a
  // user with no identities. The backlog (US01) asks us to tell the person, so we do.
  if (data.user && data.user.identities?.length === 0) return emailInUse(form);

  if (data.session) redirect(homeFor(v.role)); // Email confirmation is switched off.
  redirect(verifyUrl(v.email, "signup"));
}

function emailInUse(form: FormData): FormState {
  return {
    errors: { email: "An account already uses this email. Log in, or reset your password." },
    values: keepValues(form),
  };
}

/** US02: log in. */
export async function logIn(_prev: FormState, form: FormData): Promise<FormState> {
  const parsed = logInSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values: keepValues(form) };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  const next = form.get("next")?.toString();

  if (error) {
    if (/not confirmed/i.test(error.message)) {
      await supabase.auth.resend({ type: "signup", email: parsed.data.email });
      redirect(verifyUrl(parsed.data.email, "signup", next));
    }
    return { message: friendlyAuthError(error.message), values: keepValues(form) };
  }

  const { data: profile } = await supabase.from("profiles").select("role, status").eq("id", data.user.id).single();
  if (profile?.status === "suspended") redirect("/suspended");
  redirect(safeNext(next, homeFor(profile?.role ?? "student")));
}

/** US02: ask for a password reset code. The reply is the same whether or not the email exists. */
export async function requestPasswordReset(_prev: FormState, form: FormData): Promise<FormState> {
  const parsed = emailOnlySchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values: keepValues(form) };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${env.siteUrl}/auth/confirm?next=/reset-password`,
  });
  if (error && /rate limit/i.test(error.message)) {
    return { message: friendlyAuthError(error.message), values: keepValues(form) };
  }
  redirect(verifyUrl(parsed.data.email, "recovery", "/reset-password"));
}

/** Check the code from the email (sign-up confirmation or password reset). */
export async function verifyCode(_prev: FormState, form: FormData): Promise<FormState> {
  const parsed = otpSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values: keepValues(form) };

  const purpose = form.get("purpose") === "recovery" ? "recovery" : "email";
  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({
    email: parsed.data.email,
    token: parsed.data.token,
    type: purpose,
  });
  if (error || !data.user) {
    return {
      errors: { token: "That code is wrong or has expired. Check the latest email, or send a new code." },
      values: keepValues(form),
    };
  }

  if (purpose === "recovery") redirect("/reset-password");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).single();
  redirect(safeNext(form.get("next")?.toString(), homeFor(profile?.role ?? "student")));
}

/** Send a fresh code. */
export async function resendCode(_prev: FormState, form: FormData): Promise<FormState> {
  const parsed = emailOnlySchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const supabase = await createClient();
  const { error } =
    form.get("purpose") === "recovery"
      ? await supabase.auth.resetPasswordForEmail(parsed.data.email, {
          redirectTo: `${env.siteUrl}/auth/confirm?next=/reset-password`,
        })
      : await supabase.auth.resend({ type: "signup", email: parsed.data.email });
  if (error) return { message: friendlyAuthError(error.message) };
  return { ok: true, message: "We sent a new code. It can take a minute to arrive." };
}

/** Set a new password after a reset code was accepted. */
export async function setNewPassword(_prev: FormState, form: FormData): Promise<FormState> {
  const parsed = newPasswordSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error || !data.user) return { message: friendlyAuthError(error?.message ?? "") };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).single();
  redirect(homeFor(profile?.role ?? "student"));
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/welcome");
}

/** Supabase's error messages, reworded for students. */
function friendlyAuthError(message: string): string {
  if (/invalid login credentials/i.test(message)) return "That email and password do not match. Try again or reset your password.";
  if (/rate limit|too many/i.test(message)) return "Too many attempts. Please wait a few minutes and try again.";
  if (/same.*password|different from the old/i.test(message)) return "Choose a password you have not used before.";
  if (/weak|pwned/i.test(message)) return "That password is too easy to guess. Choose a stronger one.";
  return "Something went wrong. Please try again.";
}
