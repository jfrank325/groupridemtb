import { z } from 'zod';

export const rideSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Ride name is required.")
      .max(120, "Ride name cannot exceed 120 characters."),
    trailIds: z
      .array(z.string().min(1))
      .max(20, "Maximum 20 trails allowed.")
      .optional(),
    location: z
      .string()
      .trim()
      .max(255, "Location cannot exceed 255 characters.")
      .optional(),
    time: z
      .string()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Please select a valid time."),
    recurrence: z
      .enum(["none", "daily", "weekly", "monthly", "yearly"] as const)
      .default("none"),
    date: z.string().min(1, "Please choose a date."),
    durationMin: z
      .number()
      .min(1, "Please enter a duration.")
      .max(1440, "Duration cannot exceed 24 hours (1440 minutes)."),
    notes: z
      .string()
      .max(5000, "Notes cannot exceed 5000 characters.")
      .trim()
      .optional(),
    postponed: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    const hasTrails = (data.trailIds?.length ?? 0) > 0;
    const location = data.location?.trim();
    const hasLocation = !!location;

    if (!hasTrails && !hasLocation) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["trailIds"],
        message: "Select at least one trail or provide a location.",
      });
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["location"],
        message: "Provide a location when no trails are selected.",
      });
    }
  });

export type RideFormData = z.input<typeof rideSchema>;
