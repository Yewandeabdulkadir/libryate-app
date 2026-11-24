import type { Book, Subject } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";

// Catalogue reads. The database only returns books this user is allowed to see.

export async function getSubjects(): Promise<Subject[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("subjects").select("*").order("sort_order");
  if (error) throw error;
  return data;
}

export function subjectMap(subjects: Subject[]): Map<string, Subject> {
  return new Map(subjects.map((s) => [s.id, s]));
}

export async function getPublishedBooks(options: { subjectId?: string; limit?: number } = {}): Promise<Book[]> {
  const supabase = await createClient();
  let query = supabase
    .from("books")
    .select("*")
    .eq("status", "published")
    .order(options.subjectId ? "title" : "published_at", { ascending: !!options.subjectId })
    .limit(options.limit ?? 200);
  if (options.subjectId) query = query.eq("subject_id", options.subjectId);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getBook(id: string): Promise<Book | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.from("books").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function searchBooks(q: string, subject?: string): Promise<Book[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("search_books", { q, subject: subject ?? null, max_results: 50 });
  if (error) throw error;
  return data ?? [];
}

export async function bookCountsBySubject(): Promise<Map<string, number>> {
  const books = await getPublishedBooks({ limit: 1000 });
  const counts = new Map<string, number>();
  for (const b of books) counts.set(b.subject_id, (counts.get(b.subject_id) ?? 0) + 1);
  return counts;
}
