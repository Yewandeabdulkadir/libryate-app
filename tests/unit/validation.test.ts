import { describe, expect, it } from "vitest";
import { fieldErrors, newPasswordSchema, otpSchema, searchSchema, signUpSchema } from "@/lib/validation";

const good = {
  role: "student",
  fullName: "Amaka Obi",
  email: "  Amaka@Example.com ",
  password: "lawschool1",
  institution: "Nigerian Law School, Lagos Campus",
  consent: "on",
};

describe("sign-up form (US01, US03, US29)", () => {
  it("accepts a valid student and tidies the email", () => {
    const r = signUpSchema.parse(good);
    expect(r.email).toBe("amaka@example.com");
    expect(r.course).toBeUndefined();
  });

  it("rejects a bad email, a weak password and missing consent", () => {
    const r = signUpSchema.safeParse({ ...good, email: "nope", password: "short", consent: undefined });
    expect(r.success).toBe(false);
    if (!r.success) {
      const e = fieldErrors(r.error);
      expect(e.email).toMatch(/valid email/);
      expect(e.password).toMatch(/8 characters/);
      expect(e.consent).toMatch(/accept/);
    }
  });

  it("does not let the form ask for the admin role", () => {
    expect(signUpSchema.safeParse({ ...good, role: "admin" }).success).toBe(false);
  });

  it("needs a password with a letter and a number", () => {
    expect(signUpSchema.safeParse({ ...good, password: "abcdefgh" }).success).toBe(false);
    expect(signUpSchema.safeParse({ ...good, password: "12345678" }).success).toBe(false);
  });
});

describe("codes and passwords (US02)", () => {
  it("accepts a 6-digit code only", () => {
    expect(otpSchema.safeParse({ email: "a@b.co", token: "123456" }).success).toBe(true);
    expect(otpSchema.safeParse({ email: "a@b.co", token: "12ab56" }).success).toBe(false);
  });

  it("requires both new passwords to match", () => {
    const r = newPasswordSchema.safeParse({ password: "lawschool1", confirm: "lawschool2" });
    expect(r.success).toBe(false);
    if (!r.success) expect(fieldErrors(r.error).confirm).toMatch(/do not match/);
  });
});

describe("search (US04)", () => {
  it("needs at least 2 characters", () => {
    expect(searchSchema.safeParse({ q: "a" }).success).toBe(false);
    expect(searchSchema.safeParse({ q: " bail " }).success).toBe(true);
  });

  it("rejects odd subject ids", () => {
    expect(searchSchema.safeParse({ q: "bail", subject: "'; drop table" }).success).toBe(false);
  });
});
