import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import type { AuthorProfile, Book, Profile } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";
import { reviewAuthor, reviewBook, setAccountStatus } from "./actions";

export const metadata = { title: "Admin" };

const TABS = [
  ["users", "Users"],
  ["authors", "Authors"],
  ["books", "Books to review"],
] as const;

// Sprint 1 admin tools: find and suspend users (US23), approve authors (US18),
// and publish or reject books (US22). The full super-dashboard (US24) comes later.
export default async function Admin({ searchParams }: { searchParams: Promise<{ tab?: string; q?: string }> }) {
  const me = await requireProfile(["admin"]);
  const { tab = "users", q = "" } = await searchParams;
  const supabase = await createClient();

  const [{ count: users }, { count: published }, { count: pendingBooks }, { count: pendingAuthors }] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("books").select("*", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("books").select("*", { count: "exact", head: true }).eq("status", "pending_review"),
    supabase.from("author_profiles").select("*", { count: "exact", head: true }).eq("approval_status", "pending"),
  ]);

  return (
    <div className="stack" style={{ paddingBlock: "14px 96px", gap: 18 }}>
      <h1>Admin</h1>
      <div className="kpis">
        <Kpi label="Users" value={users} />
        <Kpi label="Published books" value={published} />
        <Kpi label="Books to review" value={pendingBooks} />
        <Kpi label="Authors to approve" value={pendingAuthors} />
      </div>

      <div className="tabs2" role="tablist">
        {TABS.map(([key, label]) => (
          <Link key={key} href={`/admin?tab=${key}`} role="tab" aria-selected={tab === key}>
            {label}
          </Link>
        ))}
      </div>

      {tab === "users" && <UsersTab q={q} meId={me.id} />}
      {tab === "authors" && <AuthorsTab />}
      {tab === "books" && <BooksTab />}
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="kpi">
      <div className="v">{value ?? 0}</div>
      <div className="l">{label}</div>
    </div>
  );
}

async function UsersTab({ q, meId }: { q: string; meId: string }) {
  const supabase = await createClient();
  let query = supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(50);
  const term = q.trim().replace(/[%,()_\\]/g, "");
  if (term) query = query.or(`full_name.ilike.%${term}%,email.ilike.%${term}%`);
  const { data } = await query;
  const people = (data ?? []) as Profile[];

  return (
    <section className="stack">
      <form className="searchbar" action="/admin">
        <input type="hidden" name="tab" value="users" />
        <label htmlFor="uq" className="sr-only">
          Find a user
        </label>
        <input id="uq" type="search" name="q" defaultValue={q} placeholder="Name or email" />
        <button className="btn" type="submit">
          Find
        </button>
      </form>
      <div className="list">
        {people.map((p) => (
          <div key={p.id} className="li">
            <div className="grow stack-s">
              <strong>{p.full_name || "(no name)"}</strong>
              <span className="small muted">
                {p.email} · {p.role}
              </span>
            </div>
            {p.status === "suspended" && <span className="pill bad">Suspended</span>}
            {p.id !== meId && (
              <form action={setAccountStatus}>
                <input type="hidden" name="target" value={p.id} />
                <input type="hidden" name="status" value={p.status === "active" ? "suspended" : "active"} />
                <button className={`btn sm ${p.status === "active" ? "quiet" : ""}`} type="submit">
                  {p.status === "active" ? "Suspend" : "Reactivate"}
                </button>
              </form>
            )}
          </div>
        ))}
        {people.length === 0 && <p className="muted">No users match.</p>}
      </div>
    </section>
  );
}

async function AuthorsTab() {
  const supabase = await createClient();
  const { data: authors } = await supabase
    .from("author_profiles")
    .select("*")
    .eq("approval_status", "pending")
    .order("created_at");
  const ids = (authors ?? []).map((a) => a.user_id);
  const { data: profiles } = ids.length
    ? await supabase.from("profiles").select("*").in("id", ids)
    : { data: [] as Profile[] };
  const byId = new Map((profiles ?? []).map((p) => [p.id, p]));

  if (!authors?.length) return <p className="muted">No authors are waiting for approval.</p>;
  return (
    <div className="stack">
      {(authors as AuthorProfile[]).map((a) => {
        const p = byId.get(a.user_id);
        return (
          <div key={a.user_id} className="card stack-s">
            <strong>{p?.full_name || "(no name)"}</strong>
            <span className="small muted">{p?.email}</span>
            <ReviewButtons target={a.user_id} action={reviewAuthor} approve="approved" />
          </div>
        );
      })}
    </div>
  );
}

async function BooksTab() {
  const supabase = await createClient();
  const { data } = await supabase.from("books").select("*").eq("status", "pending_review").order("created_at");
  const books = (data ?? []) as Book[];
  if (!books.length) return <p className="muted">No books are waiting for review.</p>;
  return (
    <div className="stack">
      {books.map((b) => (
        <div key={b.id} className="card stack-s">
          <Link href={`/books/${b.id}`}>
            <strong>{b.title}</strong>
          </Link>
          <span className="small muted">
            {b.author_name} · {b.subject_id}
          </span>
          <ReviewButtons target={b.id} action={reviewBook} approve="published" />
        </div>
      ))}
    </div>
  );
}

function ReviewButtons({
  target,
  action,
  approve,
}: {
  target: string;
  action: (form: FormData) => Promise<void>;
  approve: string;
}) {
  return (
    <div className="stack-s">
      <form action={action}>
        <input type="hidden" name="target" value={target} />
        <input type="hidden" name="decision" value={approve} />
        <button className="btn sm" type="submit">
          {approve === "published" ? "Publish" : "Approve"}
        </button>
      </form>
      <form action={action} className="row">
        <input type="hidden" name="target" value={target} />
        <input type="hidden" name="decision" value="rejected" />
        <label htmlFor={`r-${target}`} className="sr-only">
          Reason for rejecting
        </label>
        <input id={`r-${target}`} name="reason" placeholder="Reason (required to reject)" required style={{ flex: 1, minWidth: 160 }} />
        <button className="btn sm danger" type="submit">
          Reject
        </button>
      </form>
    </div>
  );
}
