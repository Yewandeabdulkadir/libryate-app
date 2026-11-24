/** Public address of a cover image in the book-covers storage bucket. */
export function coverUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  const clean = path.split("/").map(encodeURIComponent).join("/");
  return `${base.replace(/\/$/, "")}/storage/v1/object/public/book-covers/${clean}`;
}

export const BOOK_STATUS_LABEL = {
  draft: "Draft",
  pending_review: "Pending review",
  published: "Published",
  rejected: "Rejected",
  unpublished: "Unpublished",
} as const;
