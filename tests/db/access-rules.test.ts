import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Session, TEST_DATABASE_URL, anon, resetDatabase, user } from "./helpers";

// These tests prove the database's access rules (Row Level Security) behave as the
// backlog's acceptance criteria require. They run against a real Postgres.

const PUBLISHED_COUNT = 8; // published books in supabase/seed.sql
const PENDING_BOOK = "00000000-0000-4000-8000-000000000009";
const PUBLISHED_BOOK = "00000000-0000-4000-8000-000000000001";

describe.skipIf(!TEST_DATABASE_URL)("database access rules", () => {
  let s: Session;
  let student: string;
  let author: string;
  let admin: string;

  beforeAll(async () => {
    await resetDatabase();
    s = await Session.open();
    student = await s.signUp("student@example.com", {
      full_name: "Amaka Student",
      institution: "Nigerian Law School, Lagos Campus",
      course: "Bar Part II",
      level: "2026/2027",
      consent: "true",
    });
    author = await s.signUp("author@example.com", { full_name: "Ade Author", role: "author" });
    admin = await s.signUp("admin@example.com", { full_name: "Admin" });
    await s.admin("update public.profiles set role = 'admin' where id = $1", [admin]);
  });

  afterAll(async () => {
    await s?.close();
  });

  describe("sign-up (US01, US03, US18, US29)", () => {
    it("creates a student profile with study details and consent time", async () => {
      const [p] = await s.as(user(student), "select * from public.profiles where id = $1", [student]);
      expect(p).toMatchObject({
        role: "student",
        status: "active",
        full_name: "Amaka Student",
        email: "student@example.com",
        institution: "Nigerian Law School, Lagos Campus",
        course: "Bar Part II",
        level: "2026/2027",
      });
      expect(p.consent_accepted_at).not.toBeNull();
    });

    it("creates an author profile awaiting admin approval", async () => {
      const [ap] = await s.as(user(author), "select approval_status from public.author_profiles where user_id = $1", [author]);
      expect(ap.approval_status).toBe("pending");
    });

    it("never lets someone sign up as an admin", async () => {
      const sneaky = await s.signUp("sneaky@example.com", { role: "admin" });
      const [p] = await s.admin("select role from public.profiles where id = $1", [sneaky]);
      expect(p.role).toBe("student");
    });
  });

  describe("profiles", () => {
    it("lets users edit their own study details (US03)", async () => {
      await s.as(user(student), "update public.profiles set level = 'Bar Finals' where id = $1", [student]);
      const [p] = await s.admin("select level from public.profiles where id = $1", [student]);
      expect(p.level).toBe("Bar Finals");
    });

    it("stops users from making themselves admin", async () => {
      await expect(
        s.as(user(student), "update public.profiles set role = 'admin' where id = $1", [student]),
      ).rejects.toThrow(/permission denied/);
    });

    it("stops users from un-suspending themselves", async () => {
      await expect(
        s.as(user(student), "update public.profiles set status = 'active' where id = $1", [student]),
      ).rejects.toThrow(/permission denied/);
    });

    it("hides other people's profiles from students", async () => {
      const rows = await s.as(user(student), "select id from public.profiles");
      expect(rows.map((r) => r.id)).toEqual([student]);
    });

    it("lets admins see every profile", async () => {
      const rows = await s.as(user(admin), "select id from public.profiles");
      expect(rows.length).toBeGreaterThanOrEqual(4);
    });

    it("shows nothing to someone who is not logged in", async () => {
      await expect(s.as(anon, "select * from public.profiles")).rejects.toThrow(/permission denied/);
    });
  });

  describe("catalogue (US04, US05, US06)", () => {
    it("shows students only published books", async () => {
      const rows = await s.as(user(student), "select id, status from public.books");
      expect(rows).toHaveLength(PUBLISHED_COUNT);
      expect(rows.every((r) => r.status === "published")).toBe(true);
    });

    it("lists every published title in a subject", async () => {
      const rows = await s.as(user(student), "select title from public.books where subject_id = 'civil-litigation' order by title");
      expect(rows.map((r) => r.title)).toEqual(["Civil Procedure in Practice", "Drafting Pleadings: A Workbook"]);
    });

    it("hides the catalogue from people who are not logged in", async () => {
      await expect(s.as(anon, "select * from public.books")).rejects.toThrow(/permission denied/);
    });

    it("returns the five Law School subjects", async () => {
      const rows = await s.as(user(student), "select name from public.subjects order by sort_order");
      expect(rows.map((r) => r.name)).toEqual([
        "Civil Litigation",
        "Criminal Litigation",
        "Property Law Practice",
        "Corporate Law Practice",
        "Professional Ethics and Skills",
      ]);
    });

    it.each([
      ["title", "pleadings", "Drafting Pleadings: A Workbook"],
      ["author", "okonkwo", "Civil Procedure in Practice"],
      ["subject", "property law", "Conveyancing and Land Transactions"],
      ["keyword", "CAMA", "Company Formation and Governance"],
    ])("search finds books by %s", async (_kind, q, expected) => {
      const rows = await s.as(user(student), "select title from public.search_books($1)", [q]);
      expect(rows.map((r) => r.title)).toContain(expected);
    });

    it("search needs at least 2 characters", async () => {
      const rows = await s.as(user(student), "select title from public.search_books('c')");
      expect(rows).toHaveLength(0);
    });

    it("search never returns unpublished books", async () => {
      const rows = await s.as(user(admin), "select id from public.search_books('insolvency')");
      expect(rows).toHaveLength(0);
    });

    it("search treats % and _ as plain text", async () => {
      const rows = await s.as(user(student), "select title from public.search_books('%%')");
      expect(rows).toHaveLength(0);
    });

    it("search can be narrowed to one subject", async () => {
      const rows = await s.as(user(student), "select subject_id from public.search_books('okonkwo', 'criminal-litigation')");
      expect(rows.map((r) => r.subject_id)).toEqual(["criminal-litigation"]);
    });
  });

  describe("authors and books (US19, US22)", () => {
    it("stops authors adding books before an admin approves them", async () => {
      await expect(
        s.as(
          user(author),
          "insert into public.books (title, author_name, subject_id, author_id, status) values ('X', 'Ade', 'civil-litigation', $1, 'draft')",
          [author],
        ),
      ).rejects.toThrow(/row-level security/);
    });

    it("lets an admin approve an author, and logs it", async () => {
      await s.as(user(admin), "select public.admin_review_author($1, 'approved')", [author]);
      const [log] = await s.as(
        user(admin),
        "select action, actor_id from public.admin_audit_log where target_id = $1 order by id desc limit 1",
        [author],
      );
      expect(log).toMatchObject({ action: "review_author", actor_id: admin });
    });

    it("lets an approved author submit a book for review", async () => {
      const [b] = await s.as(
        user(author),
        "insert into public.books (title, author_name, subject_id, author_id, status) values ('My Book', 'Ade', 'civil-litigation', $1, 'pending_review') returning id, status",
        [author],
      );
      expect(b.status).toBe("pending_review");
    });

    it("stops authors publishing their own books", async () => {
      await expect(
        s.as(
          user(author),
          "insert into public.books (title, author_name, subject_id, author_id, status) values ('Y', 'Ade', 'civil-litigation', $1, 'published')",
          [author],
        ),
      ).rejects.toThrow(/Only an admin can publish/);
    });

    it("stops authors adding books in someone else's name", async () => {
      await expect(
        s.as(
          user(author),
          "insert into public.books (title, author_name, subject_id, author_id, status) values ('Z', 'Ade', 'civil-litigation', $1, 'draft')",
          [student],
        ),
      ).rejects.toThrow();
    });

    it("lets authors see their own unpublished books but not others'", async () => {
      const rows = await s.as(user(author), "select title from public.books where status <> 'published'");
      expect(rows.map((r) => r.title)).toEqual(["My Book"]);
    });

    it("stops students using admin actions", async () => {
      await expect(
        s.as(user(student), "select public.admin_review_book($1, 'published')", [PENDING_BOOK]),
      ).rejects.toThrow(/Admins only/);
    });

    it("lets an admin publish a pending book, which then appears in the catalogue", async () => {
      await s.as(user(admin), "select public.admin_review_book($1, 'published')", [PENDING_BOOK]);
      const rows = await s.as(user(student), "select published_at from public.books where id = $1", [PENDING_BOOK]);
      expect(rows).toHaveLength(1);
      expect(rows[0].published_at).not.toBeNull();
    });

    it("requires a reason to reject a book, and shows the reason to the author", async () => {
      const [b] = await s.as(user(author), "select id from public.books where title = 'My Book'");
      await expect(s.as(user(admin), "select public.admin_review_book($1, 'rejected')", [b.id])).rejects.toThrow(/reason/);
      await s.as(user(admin), "select public.admin_review_book($1, 'rejected', 'Cover is missing')", [b.id]);
      const [mine] = await s.as(user(author), "select status, rejection_reason from public.books where id = $1", [b.id]);
      expect(mine).toMatchObject({ status: "rejected", rejection_reason: "Cover is missing" });
    });

    it("stops authors editing a published book", async () => {
      await s.admin("update public.books set author_id = $1 where id = $2", [author, PUBLISHED_BOOK]);
      const rows = await s.as(user(author), "update public.books set title = 'Changed' where id = $1 returning id", [PUBLISHED_BOOK]);
      expect(rows).toHaveLength(0);
      await s.admin("update public.books set author_id = null where id = $1", [PUBLISHED_BOOK]);
    });
  });

  describe("admin account management (US23)", () => {
    it("lets an admin suspend a user, which hides the catalogue from them, and logs it", async () => {
      await s.as(user(admin), "select public.admin_set_account_status($1, 'suspended', 'Test')", [student]);
      const rows = await s.as(user(student), "select id from public.books");
      expect(rows).toHaveLength(0);
      const [log] = await s.as(
        user(admin),
        "select details from public.admin_audit_log where action = 'set_account_status' order by id desc limit 1",
      );
      expect(log.details).toMatchObject({ from: "active", to: "suspended", reason: "Test" });
    });

    it("lets an admin reactivate the user", async () => {
      await s.as(user(admin), "select public.admin_set_account_status($1, 'active')", [student]);
      const rows = await s.as(user(student), "select id from public.books");
      expect(rows.length).toBeGreaterThan(0);
    });

    it("stops admins locking themselves out", async () => {
      await expect(
        s.as(user(admin), "select public.admin_set_account_status($1, 'suspended')", [admin]),
      ).rejects.toThrow(/your own/);
    });

    it("hides the audit log from non-admins", async () => {
      const rows = await s.as(user(student), "select * from public.admin_audit_log");
      expect(rows).toHaveLength(0);
    });
  });

  describe("book file storage (US27 groundwork)", () => {
    it("stops students reading raw book files", async () => {
      await s.admin("insert into storage.objects (bucket_id, name) values ('book-files', $1)", [`${author}/my-book.pdf`]);
      const rows = await s.as(user(student), "select name from storage.objects where bucket_id = 'book-files'");
      expect(rows).toHaveLength(0);
    });

    it("lets the uploading author read their own file", async () => {
      const rows = await s.as(user(author), "select name from storage.objects where bucket_id = 'book-files'");
      expect(rows.map((r) => r.name)).toEqual([`${author}/my-book.pdf`]);
    });

    it("stops authors uploading into another author's folder", async () => {
      await expect(
        s.as(user(author), "insert into storage.objects (bucket_id, name) values ('book-files', $1)", [`${student}/x.pdf`]),
      ).rejects.toThrow(/row-level security/);
    });

    it("stops students uploading book files", async () => {
      await expect(
        s.as(user(student), "insert into storage.objects (bucket_id, name) values ('book-files', $1)", [`${student}/x.pdf`]),
      ).rejects.toThrow(/row-level security/);
    });
  });

  describe("settings that are still to be decided", () => {
    it("marks pricing and revenue split as undecided placeholders", async () => {
      const rows = await s.as(user(student), "select key, value from public.app_settings where key in ('pricing', 'revenue_split')");
      expect(rows).toHaveLength(2);
      for (const r of rows) expect((r.value as { decided: boolean }).decided).toBe(false);
    });

    it("stops students changing settings", async () => {
      const rows = await s.as(user(student), "update public.app_settings set value = '1' where key = 'free_trial_days' returning key");
      expect(rows).toHaveLength(0);
    });
  });
});
