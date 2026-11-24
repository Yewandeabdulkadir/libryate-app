import Link from "next/link";

export default function BookNotFound() {
  return (
    <div className="empty" style={{ paddingBlock: 60 }}>
      <h1>Book not found</h1>
      <p className="muted">It may have been removed, or the link is wrong.</p>
      <Link className="btn" href="/catalogue">
        Back to the catalogue
      </Link>
    </div>
  );
}
