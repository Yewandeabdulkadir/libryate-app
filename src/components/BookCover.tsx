import type { Book, Subject } from "@/lib/database.types";
import { coverUrl } from "@/lib/books";

/**
 * Book cover. Until a real cover image is uploaded we draw one in CSS, as the prototype does,
 * which costs students no data.
 */
export function BookCover({
  book,
  subject,
  large = false,
}: {
  book: Pick<Book, "title" | "author_name" | "cover_path">;
  subject?: Pick<Subject, "color"> | null;
  large?: boolean;
}) {
  const url = coverUrl(book.cover_path);
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img className={`cover${large ? " lg" : ""}`} src={url} alt="" loading="lazy" style={{ padding: 0, objectFit: "cover" }} />;
  }
  return (
    <div className={`cover${large ? " lg" : ""}`} style={{ background: subject?.color ?? "#1F4BA5" }} aria-hidden="true">
      <span className="ct">{book.title}</span>
      <span className="ca">{book.author_name}</span>
    </div>
  );
}
