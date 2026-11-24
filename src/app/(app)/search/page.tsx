import Link from "next/link";
import { BookRow } from "@/components/BookCard";
import { SearchBar } from "@/components/SearchBar";
import { getSubjects, searchBooks, subjectMap } from "@/lib/catalogue";
import { searchSchema } from "@/lib/validation";

export const metadata = { title: "Search" };

// US04: search by title, author, subject or keyword.
export default async function Search({ searchParams }: { searchParams: Promise<{ q?: string; subject?: string }> }) {
  const raw = await searchParams;
  const subjects = await getSubjects();
  const bySubject = subjectMap(subjects);
  const parsed = searchSchema.safeParse({ q: raw.q ?? "", subject: raw.subject || undefined });
  const typed = (raw.q ?? "").trim();
  const results = parsed.success ? await searchBooks(parsed.data.q, parsed.data.subject) : [];
  const within = parsed.success && parsed.data.subject ? bySubject.get(parsed.data.subject) : undefined;

  return (
    <div className="stack" style={{ paddingBlock: "14px 96px" }}>
      <h1>Search</h1>
      <SearchBar defaultValue={typed} subject={within?.id} />

      {typed.length === 1 && <p className="small muted">Type at least 2 characters.</p>}

      {parsed.success && (
        <>
          <p className="small muted" aria-live="polite">
            {results.length} {results.length === 1 ? "result" : "results"} for “{parsed.data.q}”
            {within ? ` in ${within.name}` : ""}
            {within && (
              <>
                {" · "}
                <Link href={`/search?q=${encodeURIComponent(parsed.data.q)}`}>search all subjects</Link>
              </>
            )}
          </p>
          {results.length > 0 ? (
            <div className="list">
              {results.map((b) => (
                <BookRow key={b.id} book={b} subject={bySubject.get(b.subject_id)} />
              ))}
            </div>
          ) : (
            <div className="empty">
              <h2>No results</h2>
              <p className="muted">Check the spelling, try fewer words, or browse a subject:</p>
              <div className="row" style={{ justifyContent: "center" }}>
                {subjects.map((s) => (
                  <Link key={s.id} href={`/subjects/${s.id}`} className="pill acc">
                    {s.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {!typed && (
        <div className="stack-s">
          <p className="eyebrow">Browse by subject</p>
          <div className="row">
            {subjects.map((s) => (
              <Link key={s.id} href={`/subjects/${s.id}`} className="pill acc">
                {s.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
