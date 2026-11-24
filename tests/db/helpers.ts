import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { Client } from "pg";

/**
 * Database tests need a throwaway Postgres. Set TEST_DATABASE_URL to an EMPTY database you
 * are happy to wipe, e.g. postgres://postgres@localhost:5432/libryate_test.
 * When it is not set, the database tests are skipped.
 */
export const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;

const root = path.resolve(__dirname, "../..");

export async function resetDatabase(): Promise<void> {
  const db = new Client({ connectionString: TEST_DATABASE_URL });
  await db.connect();
  try {
    await db.query(`
      drop schema if exists public cascade;
      drop schema if exists auth cascade;
      drop schema if exists storage cascade;
      create schema public;
      grant usage, create on schema public to public;
    `);
    await db.query(readFileSync(path.join(root, "tests/db/supabase-stub.sql"), "utf8"));
    const dir = path.join(root, "supabase/migrations");
    for (const file of readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) {
      await db.query(readFileSync(path.join(dir, file), "utf8"));
    }
    await db.query(readFileSync(path.join(root, "supabase/seed.sql"), "utf8"));
  } finally {
    await db.end();
  }
}

export type Actor = { id: string | null; role: "anon" | "authenticated" | "service_role" };

/** A connection that behaves like a request from a given user, with RLS applied. */
export class Session {
  private constructor(private db: Client) {}

  static async open(): Promise<Session> {
    const db = new Client({ connectionString: TEST_DATABASE_URL });
    await db.connect();
    return new Session(db);
  }

  /** Run SQL as a user. Each call is its own transaction, rolled back on error. */
  async as<T = Record<string, unknown>>(actor: Actor, sql: string, params: unknown[] = []): Promise<T[]> {
    await this.db.query("begin");
    try {
      await this.db.query(`select set_config('request.jwt.claim.sub', $1, true)`, [actor.id ?? ""]);
      await this.db.query(`set local role ${actor.role}`);
      const result = await this.db.query(sql, params);
      await this.db.query("commit");
      return result.rows as T[];
    } catch (error) {
      await this.db.query("rollback");
      throw error;
    }
  }

  /** Run SQL as the database owner (no RLS), for setting up test data. */
  async admin<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T[]> {
    return (await this.db.query(sql, params)).rows as T[];
  }

  /** Create a login the way Supabase Auth does: insert into auth.users and let the trigger run. */
  async signUp(email: string, meta: Record<string, unknown> = {}): Promise<string> {
    const rows = await this.admin<{ id: string }>(
      "insert into auth.users (email, raw_user_meta_data) values ($1, $2) returning id",
      [email, JSON.stringify(meta)],
    );
    return rows[0].id;
  }

  async close(): Promise<void> {
    await this.db.end();
  }
}

export const user = (id: string): Actor => ({ id, role: "authenticated" });
export const anon: Actor = { id: null, role: "anon" };
