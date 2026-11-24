"use client";

import { useActionState } from "react";
import { Field, FormMessage, SubmitButton } from "@/components/form";
import type { Profile } from "@/lib/database.types";
import { initialFormState } from "@/lib/form-state";
import { LAW_SCHOOL_CAMPUSES } from "@/lib/validation";
import { updateProfile } from "./actions";

export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, action] = useActionState(updateProfile, initialFormState);
  return (
    <form action={action} className="fform" noValidate>
      <FormMessage state={state} />
      <Field label="Full name" name="fullName" defaultValue={profile.full_name} autoComplete="name" required state={state} />
      {profile.role === "student" && (
        <>
          <Field label="Institution" name="institution" list="campuses" defaultValue={profile.institution ?? ""} state={state} />
          <datalist id="campuses">
            {LAW_SCHOOL_CAMPUSES.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
          <Field label="Course" name="course" defaultValue={profile.course ?? ""} state={state} />
          <Field label="Level or session" name="level" defaultValue={profile.level ?? ""} state={state} />
        </>
      )}
      <SubmitButton pendingText="Saving…">Save changes</SubmitButton>
    </form>
  );
}
