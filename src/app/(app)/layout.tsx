import { TabBar } from "@/components/TabBar";
import { requireProfile } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();
  return (
    <>
      <main className="wrap">{children}</main>
      <TabBar role={profile.role} />
    </>
  );
}
