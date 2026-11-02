import { z } from "zod";

/**
 * Zod validation schema for user signup.
 * Matches backend validation rules (first name required, valid email, strong password).
 */
export const signupSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, "First name is required"),

  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character (!@#$%^&*)"),
});

/**
 * Zod validation schema for user login.
 * Requires a valid email and non-empty password.
 */
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),

  password: z
    .string()
    .min(1, "Password is required"),
});
