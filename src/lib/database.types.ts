// Shapes of the database tables, written by hand to match supabase/migrations.
// Once the Supabase project exists, the developer can regenerate this file with:
//   npx supabase gen types typescript --project-id <ref> > src/lib/database.types.ts

export type UserRole = "student" | "author" | "admin";
export type AccountStatus = "active" | "suspended";
export type AuthorStatus = "pending" | "approved" | "rejected";
export type BookStatus = "draft" | "pending_review" | "published" | "rejected" | "unpublished";

export type Profile = {
  id: string;
  role: UserRole;
  status: AccountStatus;
  full_name: string;
  email: string | null;
  phone: string | null;
  institution: string | null;
  course: string | null;
  level: string | null;
  consent_accepted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AuthorProfile = {
  user_id: string;
  pen_name: string | null;
  bio: string | null;
  approval_status: AuthorStatus;
  rejection_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Subject = {
  id: string;
  name: string;
  description: string | null;
  color: string;
  sort_order: number;
  created_at: string;
};

export type Book = {
  id: string;
  title: string;
  author_name: string;
  author_id: string | null;
  edition: string | null;
  subject_id: string;
  description: string;
  keywords: string[];
  isbn: string | null;
  page_count: number | null;
  cover_path: string | null;
  file_path: string | null;
  status: BookStatus;
  rejection_reason: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AuditLogEntry = {
  id: number;
  actor_id: string | null;
  action: string;
  target_table: string;
  target_id: string;
  details: Record<string, unknown>;
  created_at: string;
};

export type AppSetting = {
  key: string;
  value: unknown;
  description: string | null;
  updated_by: string | null;
  updated_at: string;
};

type Table<Row, Required extends keyof Row = never> = {
  Row: Row;
  Insert: Partial<Row> & Pick<Row, Required>;
  Update: Partial<Row>;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      profiles: Table<Profile, "id">;
      author_profiles: Table<AuthorProfile, "user_id">;
      subjects: Table<Subject, "id" | "name">;
      books: Table<Book, "title" | "author_name" | "subject_id">;
      admin_audit_log: Table<AuditLogEntry, "action" | "target_table" | "target_id">;
      app_settings: Table<AppSetting, "key" | "value">;
    };
    Views: Record<string, never>;
    Functions: {
      search_books: {
        Args: { q: string; subject?: string | null; max_results?: number };
        Returns: Book[];
      };
      is_admin: { Args: Record<string, never>; Returns: boolean };
      admin_set_account_status: {
        Args: { target: string; new_status: AccountStatus; reason?: string | null };
        Returns: undefined;
      };
      admin_set_role: { Args: { target: string; new_role: UserRole }; Returns: undefined };
      admin_review_author: {
        Args: { target: string; decision: AuthorStatus; reason?: string | null };
        Returns: undefined;
      };
      admin_review_book: {
        Args: { target: string; decision: BookStatus; reason?: string | null };
        Returns: undefined;
      };
    };
    Enums: {
      user_role: UserRole;
      account_status: AccountStatus;
      author_status: AuthorStatus;
      book_status: BookStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
