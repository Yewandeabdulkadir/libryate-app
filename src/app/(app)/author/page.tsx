import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { BOOK_STATUS_LABEL } from "@/lib/books";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Author dashboard" };

// Sprint 1: shows approval status and the author's books.
// Profile/bank details (US18), upload (US19) and earnings (US20) arrive in Sprint 4.
export default async function AuthorHome() {
  const profile = await requireProfile(["author", "admin"]);
  const supabase = await createClient();
  const [{ data: author }, { data: books }] = await Promise.all([
    supabase.from("author_profiles").select("*").eq("user_id", profile.id).maybeSingle(),
    supabase.from("books").select("id, title, status, rejection_reason").eq("author_id", profile.id).order("created_at"),
  ]);

  const status = author?.approval_status ?? "pending";
  return (
    <div className="stack" style={{ paddingBlock: "14px 96px", gap: 18 }}>
      <h1>Author dashboard</h1>
      {status === "pending" && (
        <p className="banner warn">Thanks for joining. An admin will review your account soon.</p>
      )}
      {status === "rejected" && (
        <p className="banner bad">
          Your author account was not approved{author?.rejection_reason ? `: ${author.rejection_reason}` : "."}
        </p>
      )}
      {status === "approved" && <p className="banner ok">Your author account is approved.</p>}

      <section className="stack-s">
        <h2>My books</h2>
        {books && books.length > 0 ? (
          <div className="list">
            {books.map((b) => (
              <Link key={b.id} href={`/books/${b.id}`} className="li cover-link">
                <span className="grow">{b.title}</span>
                <span className={`pill ${b.status === "published" ? "ok" : b.status === "rejected" ? "bad" : "warn"}`}>
                  {BOOK_STATUS_LABEL[b.status]}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="muted">You have no books on Libryate yet. Uploading arrives in a later release.</p>
        )}
      </section>
    </div>
  );
}
