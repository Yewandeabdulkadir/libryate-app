import Link from "next/link";
import type { Book, Subject } from "@/lib/database.types";
import { BookCover } from "./BookCover";

export function BookCard({ book, subject }: { book: Book; subject?: Subject | null }) {
  return (
    <Link href={`/books/${book.id}`} className="bookbtn cover-link">
      <BookCover book={book} subject={subject} />
      <span className="bt">{book.title}</span>
      <span className="small muted">{book.author_name}</span>
    </Link>
  );
}

/** A list row with a small cover, title, author and subject (US04 search results). */
export function BookRow({ book, subject }: { book: Book; subject?: Subject | null }) {
  return (
    <Link href={`/books/${book.id}`} className="li cover-link">
      <BookCover book={book} subject={subject} />
      <span className="grow stack-s">
        <strong>{book.title}</strong>
        <span className="small muted">
          {book.author_name}
          {book.edition ? ` · ${book.edition}` : ""}
        </span>
        {subject && <span className="small" style={{ color: subject.color, fontWeight: 700 }}>{subject.name}</span>}
      </span>
    </Link>
  );
}
