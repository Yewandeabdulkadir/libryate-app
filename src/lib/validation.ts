import { z } from "zod";

// Form rules, shared by the server actions and the unit tests.

const email = z.string().trim().toLowerCase().email("Enter a valid email address");
const password = z
  .string()
  .min(8, "Use at least 8 characters")
  .max(72, "Use 72 characters or fewer")
  .regex(/[A-Za-z]/, "Include at least one letter")
  .regex(/[0-9]/, "Include at least one number");

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : undefined));

export const signUpSchema = z.object({
  role: z.enum(["student", "author"]).default("student"),
  fullName: z.string().trim().min(2, "Enter your full name").max(120),
  email,
  password,
  institution: optionalText(120),
  course: optionalText(120),
  level: optionalText(60),
  consent: z.literal("on", { errorMap: () => ({ message: "Please accept the terms and privacy notice" }) }),
});

export const logInSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password"),
});

export const emailOnlySchema = z.object({ email });

export const otpSchema = z.object({
  email,
  token: z
    .string()
    .trim()
    .regex(/^[0-9]{6,10}$/, "Enter the code from your email"),
});

export const newPasswordSchema = z
  .object({ password, confirm: z.string() })
  .refine((v) => v.password === v.confirm, { message: "The passwords do not match", path: ["confirm"] });

export const profileSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name").max(120),
  institution: optionalText(120),
  course: optionalText(120),
  level: optionalText(60),
});

export const searchSchema = z.object({
  q: z.string().trim().min(2, "Type at least 2 characters").max(100),
  subject: z.string().regex(/^[a-z0-9-]{2,40}$/).optional(),
});

export type FieldErrors = Partial<Record<string, string>>;

/** Turn zod errors into one message per field, for showing under each input. */
export function fieldErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}

/** Institutions offered in the sign-up form (US03). Students can also type their own. */
export const LAW_SCHOOL_CAMPUSES = [
  "Nigerian Law School, Abuja (Bwari) Campus",
  "Nigerian Law School, Lagos Campus",
  "Nigerian Law School, Enugu Campus",
  "Nigerian Law School, Kano Campus",
  "Nigerian Law School, Yenagoa Campus",
  "Nigerian Law School, Yola Campus",
  "Nigerian Law School, Port Harcourt Campus",
  "Nigerian Law School, Ilorin Campus",
] as const;
