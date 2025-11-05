import { z } from 'zod';

// Custom password validation with complexity requirements
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(100)
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

export const userSchema = z.object({
  name: z.string().min(2).max(100).trim().nonempty("Please enter your name."),
  email: z.string().email("Please enter a valid email address.").toLowerCase().trim(),
  passwordHash: passwordSchema.nonempty("Please enter a password."),
  zip: z.string().min(5).max(5).optional(),
});

export type UserFormData = z.infer<typeof userSchema>;
