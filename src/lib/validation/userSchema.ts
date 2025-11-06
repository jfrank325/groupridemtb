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
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name must be less than 100 characters").trim(),
  email: z.string().email("Please enter a valid email address").toLowerCase().trim(),
  password: passwordSchema,
  zip: z.string().regex(/^\d{5}$/, "Zip code must be 5 digits").optional().or(z.literal("")),
});

export type UserFormData = z.infer<typeof userSchema>;
