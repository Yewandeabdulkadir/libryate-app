"use server";

import { revalidatePath } from "next/cache";
import { type FormState, keepValues } from "@/lib/form-state";
import { createClient } from "@/lib/supabase/server";
import { fieldErrors, profileSchema } from "@/lib/validation";

/** US03: change name, institution, course and level. */
export async function updateProfile(_prev: FormState, form: FormData): Promise<FormState> {
  const parsed = profileSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values: keepValues(form) };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { message: "Please log in again." };

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.fullName,
      institution: parsed.data.institution ?? null,
      course: parsed.data.course ?? null,
      level: parsed.data.level ?? null,
    })
    .eq("id", user.id);
  if (error) return { message: "We could not save your changes. Please try again.", values: keepValues(form) };

  revalidatePath("/", "layout");
  return { ok: true, message: "Saved." };
}
