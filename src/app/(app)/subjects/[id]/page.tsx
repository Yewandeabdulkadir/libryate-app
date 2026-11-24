import Link from "next/link";
import { notFound } from "next/navigation";
import { BookRow } from "@/components/BookCard";
import { SearchBar } from "@/components/SearchBar";
import { getPublishedBooks, getSubjects } from "@/lib/catalogue";

// US05: every published title tagged to a subject.
export default async function SubjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const subjects = await getSubjects();
  const subject = subjects.find((s) => s.id === id);
  if (!subject) notFound();
  const books = await getPublishedBooks({ subjectId: subject.id });

  return (
    <div className="stack" style={{ paddingBlock: "14px 96px" }}>
      <Link href="/catalogue" className="back">
        ‹ Home
      </Link>
      <div className="stack-s">
        <span className="sw" style={{ width: 28, height: 5, borderRadius: 3, background: subject.color }} />
        <h1>{subject.name}</h1>
        {subject.description && <p className="muted">{subject.description}</p>}
      </div>
      <SearchBar subject={subject.id} />
      <p className="small muted">
        {books.length} {books.length === 1 ? "book" : "books"}
      </p>
      {books.length === 0 ? (
        <p className="empty muted">No books in this subject yet. Check back soon.</p>
      ) : (
        <div className="list">
          {books.map((b) => (
            <BookRow key={b.id} book={b} subject={subject} />
          ))}
        </div>
      )}
    </div>
  );
}
