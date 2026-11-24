import { requireProfile } from "@/lib/auth";
import { signOut } from "../../(auth)/actions";
import { ProfileForm } from "./ProfileForm";

export const metadata = { title: "Profile" };

const ROLE_LABEL = { student: "Student", author: "Author", admin: "Admin" } as const;

export default async function ProfilePage() {
  const profile = await requireProfile();
  return (
    <div className="stack" style={{ paddingBlock: "14px 96px", gap: 18 }}>
      <div className="row between">
        <h1>Profile</h1>
        <span className="pill acc">{ROLE_LABEL[profile.role]}</span>
      </div>
      <p className="small muted">{profile.email}</p>
      <ProfileForm profile={profile} />
      <div className="hr" />
      <form action={signOut}>
        <button className="btn ghost block" type="submit">
          Log out
        </button>
      </form>
    </div>
  );
}
