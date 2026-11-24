import Link from "next/link";
import { BookCard } from "@/components/BookCard";
import { Logo } from "@/components/Logo";
import { SearchBar } from "@/components/SearchBar";
import { requireProfile } from "@/lib/auth";
import { bookCountsBySubject, getPublishedBooks, getSubjects, subjectMap } from "@/lib/catalogue";

export const metadata = { title: "Home" };

export default async function Catalogue() {
  const profile = await requireProfile();
  const [subjects, recent, counts] = await Promise.all([
    getSubjects(),
    getPublishedBooks({ limit: 12 }),
    bookCountsBySubject(),
  ]);
  const bySubject = subjectMap(subjects);
  const firstName = profile.full_name.split(" ")[0];

  return (
    <div className="stack" style={{ gap: 22, paddingBlock: "14px 96px" }}>
      <div className="brand" style={{ padding: 0 }}>
        <Logo />
        <span className="who">{firstName ? `Hi, ${firstName}` : null}</span>
      </div>

      <SearchBar />

      <section className="stack" aria-labelledby="subjects-h">
        <h2 id="subjects-h">Subjects</h2>
        <div className="subjects">
          {subjects.map((s, i) => (
            <Link
              key={s.id}
              href={`/subjects/${s.id}`}
              className={`subj cover-link${i === subjects.length - 1 && subjects.length % 2 ? " wide" : ""}`}
            >
              <span className="sw" style={{ background: s.color }} />
              {s.name}
              <small>
                {counts.get(s.id) ?? 0} {(counts.get(s.id) ?? 0) === 1 ? "book" : "books"}
              </small>
            </Link>
          ))}
        </div>
      </section>

      <section className="stack" aria-labelledby="new-h">
        <h2 id="new-h">New on Libryate</h2>
        {recent.length === 0 ? (
          <p className="muted">No books have been published yet.</p>
        ) : (
          <div className="shelfrow">
            {recent.map((b) => (
              <BookCard key={b.id} book={b} subject={bySubject.get(b.subject_id)} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
