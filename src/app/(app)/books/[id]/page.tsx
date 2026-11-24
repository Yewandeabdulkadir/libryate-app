import Link from "next/link";
import { notFound } from "next/navigation";
import { BookCover } from "@/components/BookCover";
import { requireProfile } from "@/lib/auth";
import { BOOK_STATUS_LABEL } from "@/lib/books";
import { getBook, getSubjects } from "@/lib/catalogue";

// US06: book details. The Read button is switched on in Sprint 2 (reader) and
// checked against the student's plan in Sprint 3 (subscriptions).
export default async function BookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [profile, book, subjects] = await Promise.all([requireProfile(), getBook(id), getSubjects()]);
  if (!book) notFound();
  const subject = subjects.find((s) => s.id === book.subject_id);

  return (
    <div className="stack" style={{ paddingBlock: "14px 96px", gap: 18 }}>
      <Link href={subject ? `/subjects/${subject.id}` : "/catalogue"} className="back">
        ‹ {subject?.name ?? "Home"}
      </Link>

      {book.status !== "published" && (
        <p className="banner warn">
          {BOOK_STATUS_LABEL[book.status]}. Students cannot see this book yet.
          {book.rejection_reason ? ` Reason: ${book.rejection_reason}` : ""}
        </p>
      )}

      <div className="detail">
        <BookCover book={book} subject={subject} large />
        <div className="stack-s" style={{ minWidth: 0 }}>
          <h1 style={{ fontSize: 22 }}>{book.title}</h1>
          <p>{book.author_name}</p>
          {book.edition && <p className="small muted">{book.edition}</p>}
          {subject && (
            <span className="pill" style={{ background: subject.color, color: "#fff", alignSelf: "flex-start" }}>
              {subject.name}
            </span>
          )}
        </div>
      </div>

      {profile.role === "student" && (
        <div className="stack-s">
          <button className="btn block" type="button" disabled aria-describedby="read-soon">
            Read
          </button>
          <p id="read-soon" className="small muted" style={{ textAlign: "center" }}>
            The reader arrives in the next release.
          </p>
        </div>
      )}

      <section className="stack-s">
        <h2>About this book</h2>
        <p style={{ whiteSpace: "pre-line" }}>{book.description || "No description yet."}</p>
      </section>

      <dl className="kv">
        {book.page_count && (
          <>
            <dt>Pages</dt>
            <dd>{book.page_count}</dd>
          </>
        )}
        {book.isbn && (
          <>
            <dt>ISBN</dt>
            <dd>{book.isbn}</dd>
          </>
        )}
        {book.keywords.length > 0 && (
          <>
            <dt>Topics</dt>
            <dd>{book.keywords.join(", ")}</dd>
          </>
        )}
      </dl>
    </div>
  );
}
