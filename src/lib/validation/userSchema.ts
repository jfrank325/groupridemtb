import { z } from 'zod';

export const userSchema = z.object({
  name: z.string().min(2).max(100).nonempty("Please enter your name."),
  email: z.string().email("Please enter a valid email address."),
  passwordHash: z.string().min(6).max(100).nonempty("Please enter a password."),
  zip: z.string().min(5).max(5).optional(),
});

export type UserFormData = z.infer<typeof userSchema>;
