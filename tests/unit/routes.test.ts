import { describe, expect, it } from "vitest";
import { homeFor, isPublicPath, safeNext } from "@/lib/routes";

describe("where people land", () => {
  it("sends each role to its own home page", () => {
    expect(homeFor("student")).toBe("/catalogue");
    expect(homeFor("author")).toBe("/author");
    expect(homeFor("admin")).toBe("/admin");
  });

  it("keeps the catalogue and admin pages private", () => {
    expect(isPublicPath("/login")).toBe(true);
    expect(isPublicPath("/auth/confirm")).toBe(true);
    expect(isPublicPath("/catalogue")).toBe(false);
    expect(isPublicPath("/admin")).toBe(false);
    expect(isPublicPath("/books/123")).toBe(false);
  });

  it("only follows links back into this site after login", () => {
    expect(safeNext("/books/1", "/catalogue")).toBe("/books/1");
    expect(safeNext("https://evil.example", "/catalogue")).toBe("/catalogue");
    expect(safeNext("//evil.example", "/catalogue")).toBe("/catalogue");
    expect(safeNext("/\\evil.example", "/catalogue")).toBe("/catalogue");
    expect(safeNext(undefined, "/catalogue")).toBe("/catalogue");
  });
});
