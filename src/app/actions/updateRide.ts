'use server';

import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';

import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { sanitizeText } from '@/lib/sanitize';
import { rideSchema } from '@/lib/validation/rideSchema';

export async function updateRide(formData: FormData) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return { error: 'You must be signed in to update a ride.' };
  }

  const rideId = formData.get('rideId');

  if (!rideId || typeof rideId !== 'string') {
    return { error: 'Ride identifier is missing.' };
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  if (!user) {
    return { error: 'Unable to locate your account.' };
  }

  const ride = await prisma.ride.findUnique({
    where: { id: rideId },
    select: { userId: true },
  });

  if (!ride || ride.userId !== user.id) {
    return { error: 'You are not authorized to edit this ride.' };
  }

  const notesValue = formData.get('notes');
  const normalizedNotes =
    typeof notesValue === 'string' && notesValue.trim().length > 0
      ? notesValue
      : undefined;

  const locationValue = formData.get('location');
  const normalizedLocation =
    typeof locationValue === 'string' && locationValue.trim().length > 0
      ? locationValue
      : undefined;

  const recurrenceValue = formData.get('recurrence');
  const normalizedRecurrence =
    typeof recurrenceValue === 'string' && ['daily', 'weekly', 'monthly', 'yearly', 'none'].includes(recurrenceValue)
      ? recurrenceValue
      : undefined;

  const postponedValue = formData.get('postponed');
  const normalizedPostponed =
    postponedValue === 'true' || postponedValue === 'on' || postponedValue === '1'
      ? true
      : postponedValue === 'false' || postponedValue === 'off' || postponedValue === '0'
      ? false
      : undefined;

  const raw = {
    name: (formData.get('name') as string | null) ?? undefined,
    date: formData.get('date') as string,
    durationMin: Number(formData.get('durationMin')),
    notes: normalizedNotes,
    trailIds: formData.getAll('trailIds') as string[],
    location: normalizedLocation,
    time: formData.get('time') as string,
    recurrence: normalizedRecurrence ?? 'none',
  };

  const parsed = rideSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const trailIds = parsed.data.trailIds ?? [];

  if (trailIds.length > 0) {
    const validTrails = await prisma.trail.findMany({
      where: { id: { in: trailIds } },
      select: { id: true },
    });

    if (validTrails.length !== trailIds.length) {
      return { error: { trailIds: ['One or more selected trails are invalid.'] } };
    }
  }

  let sanitizedNotes = parsed.data.notes
    ? sanitizeText(parsed.data.notes.trim().slice(0, 5000))
    : null;

  let sanitizedLocation: string | null = null;
  if (parsed.data.location) {
    const cleaned = sanitizeText(parsed.data.location).trim();
    sanitizedLocation = cleaned.length > 0 ? cleaned.slice(0, 255) : null;
  }

  const trailsUpdate = trailIds.length
    ? {
        deleteMany: {},
        create: trailIds.map((id: string) => ({ trailId: id })),
      }
    : { deleteMany: {} };

  const updateData: {
    name: string;
    date: Date;
    durationMin: number;
    notes: string | null;
    location: string | null;
    recurrence: string;
    trails: typeof trailsUpdate;
    postponed?: boolean;
  } = {
    name: parsed.data.name.trim(),
    date: new Date(parsed.data.date),
    durationMin: parsed.data.durationMin,
    notes: sanitizedNotes,
    location: sanitizedLocation,
    recurrence: parsed.data.recurrence,
    trails: trailsUpdate,
  };

  if (normalizedPostponed !== undefined) {
    updateData.postponed = normalizedPostponed;
  }

  await prisma.ride.update({
    where: { id: rideId },
    data: updateData,
  });

  revalidatePath('/rides');
  revalidatePath(`/rides/${rideId}`);
  revalidatePath('/');

  return { success: true };
}

