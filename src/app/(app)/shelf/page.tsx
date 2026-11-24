import Link from "next/link";
import { requireProfile } from "@/lib/auth";

export const metadata = { title: "My Shelf" };

// US12 is built in Sprint 2 together with the reader.
export default async function Shelf() {
  await requireProfile(["student"]);
  return (
    <div className="empty" style={{ paddingBlock: 60 }}>
      <h1>My Shelf</h1>
      <p className="muted">Your shelf, bookmarks and notes arrive with the reader in the next release.</p>
      <Link className="btn ghost" href="/catalogue">
        Browse books
      </Link>
    </div>
  );
}
