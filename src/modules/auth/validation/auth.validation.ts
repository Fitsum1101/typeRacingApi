import { z } from "zod";

export const registerSchema = z.object({
  body: z.object({
    username: z
      .string("Username is required")
      .min(3, "Username must be at least 3 characters")
      .max(20, "Username must be at most 20 characters")
      .regex(
        /^[a-zA-Z0-9_]+$/,
        "Username can only contain letters, numbers and underscores",
      ),

    email: z
      .string("Email is required")
      .email("Please provide a valid email address")
      .toLowerCase(),

    password: z
      .string("Password is required")
      .min(6, "Password must be at least 6 characters")
      .max(50, "Password must be at most 50 characters"),

    avatar: z.string().url("Avatar must be a valid URL").optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    emailOrUsername: z
      .string("Email or username is required")
      .min(1, "Email or username is required"),

    password: z.string("Password is required").min(1, "Password is required"),
  }),
});

// Optional: Type inference (useful for TypeScript)
export type RegisterInput = z.infer<typeof registerSchema>["body"];
export type LoginInput = z.infer<typeof loginSchema>["body"];
