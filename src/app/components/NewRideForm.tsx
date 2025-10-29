'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { rideSchema, RideFormData } from '@/lib/validation/rideSchema';
import { Trail } from '../hooks/useTrails';
import { createRide } from '../actions/createRide';

type NewRideFormProps = {
  initialTrailId?: string | null;
  trails: Partial<Trail>[];
};

export function NewRideForm({ initialTrailId, trails }: NewRideFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    watch,
  } = useForm<RideFormData>({
    resolver: zodResolver(rideSchema),
    defaultValues: {
      trailIds: initialTrailId ? [initialTrailId] : [],
      date: '',
      durationMin: 120,
      notes: '',
    },
  });

  // Keep it reactive if search params change
  useEffect(() => {
    if (initialTrailId) {
      setValue('trailIds', [initialTrailId]);
    }
  }, [initialTrailId, setValue]);

  const onSubmit = async (data: RideFormData) => {
    console.log('Submitted:', data);

    const formData = new FormData();
    formData.append('date', data.date);
    formData.append('durationMin', String(data.durationMin));
    if (data.notes) formData.append('notes', data.notes);
    (data.trailIds || []).forEach((id) => formData.append('trailIds', id));

    await createRide(formData);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 p-4">
      <div>
        <label className="block font-medium">Trails</label>
        <div className="flex flex-col gap-2">
          {trails.map((trail) => (
            <label key={trail.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                value={trail.id}
                {...register('trailIds')}
                className="rounded"
              />
              {trail.name}
            </label>
          ))}
        </div>
        {errors.trailIds && (
          <p className="text-red-500 text-sm">{errors.trailIds.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="date" className="block font-medium">Date</label>
        <input
          type="date"
          id="date"
          {...register('date')}
          className="border rounded p-2 w-full"
        />
        {errors.date && <p className="text-red-500 text-sm">{errors.date.message}</p>}
      </div>

      <div>
        <label htmlFor="duration" className="block font-medium">Duration</label>
        <input
          type="text"
          id="duration"
          {...register('durationMin')}
          className="border rounded p-2 w-full"
        />
        {errors.durationMin && (
          <p className="text-red-500 text-sm">{errors.durationMin.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="notes" className="block font-medium">Notes</label>
        <textarea
          id="notes"
          {...register('notes')}
          className="border rounded p-2 w-full"
        />
      </div>

      <button
        type="submit"
        className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
      >
        Create Ride
      </button>
    </form>
  );
}
