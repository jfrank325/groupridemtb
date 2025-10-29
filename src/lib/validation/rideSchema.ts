import { z } from 'zod';

export const rideSchema = z.object({
  trailIds: z
    .array(z.string().min(1))
    .nonempty("Please select at least one trail."),
  date: z.string().min(1, "Please choose a date."),
  durationMin: z.number().min(1, "Please enter a duration."),
  notes: z.string().optional(),
});

export type RideFormData = z.infer<typeof rideSchema>;
