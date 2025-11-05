import { z } from 'zod';

export const rideSchema = z.object({
  trailIds: z
    .array(z.string().min(1))
    .min(1, "Please select at least one trail.")
    .max(20, "Maximum 20 trails allowed."),
  date: z.string().min(1, "Please choose a date."),
  durationMin: z.number()
    .min(1, "Please enter a duration.")
    .max(1440, "Duration cannot exceed 24 hours (1440 minutes)."),
  notes: z
    .string()
    .max(5000, "Notes cannot exceed 5000 characters.")
    .trim()
    .optional(),
});

export type RideFormData = z.infer<typeof rideSchema>;
