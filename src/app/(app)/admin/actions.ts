"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

// Admin actions. Each one calls a database function that checks the caller is an admin
// and writes the audit log, so these cannot be misused even if called directly.

const id = z.string().uuid();
const reason = z
  .string()
  .trim()
  .max(500)
  .optional()
  .transform((v) => v || null);

async function run(fn: () => PromiseLike<{ error: { message: string } | null }>) {
  await requireProfile(["admin"]);
  const { error } = await fn();
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

export async function setAccountStatus(form: FormData) {
  const target = id.parse(form.get("target"));
  const status = z.enum(["active", "suspended"]).parse(form.get("status"));
  const why = reason.parse(form.get("reason") ?? undefined);
  const supabase = await createClient();
  await run(() => supabase.rpc("admin_set_account_status", { target, new_status: status, reason: why }));
}

export async function reviewAuthor(form: FormData) {
  const target = id.parse(form.get("target"));
  const decision = z.enum(["approved", "rejected"]).parse(form.get("decision"));
  const why = reason.parse(form.get("reason") ?? undefined);
  const supabase = await createClient();
  await run(() => supabase.rpc("admin_review_author", { target, decision, reason: why }));
}

export async function reviewBook(form: FormData) {
  const target = id.parse(form.get("target"));
  const decision = z.enum(["published", "rejected", "unpublished"]).parse(form.get("decision"));
  const why = reason.parse(form.get("reason") ?? undefined);
  const supabase = await createClient();
  await run(() => supabase.rpc("admin_review_book", { target, decision, reason: why }));
}
