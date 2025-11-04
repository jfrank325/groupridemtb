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

  const selectedTrailIds = watch('trailIds') || [];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      {/* Ride Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-semibold text-gray-900 mb-2">
          Ride Name <span className="text-gray-600 font-normal">(optional)</span>
        </label>
        <input
          type="text"
          id="name"
          placeholder="e.g., Saturday Morning Ride, Epic Trail Adventure"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-gray-900 placeholder:text-gray-500"
        />
      </div>

      {/* Trails Selection */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-3">
          Select Trails <span className="text-red-500">*</span>
        </label>
        <div className="border border-gray-200 rounded-lg p-4 max-h-64 overflow-y-auto bg-gray-50">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {trails.map((trail) => {
              const isSelected = selectedTrailIds.includes(trail.id || '');
              return (
                <label
                  key={trail.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-gray-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/50'
                  }`}
                >
                  <input
                    type="checkbox"
                    value={trail.id}
                    {...register('trailIds')}
                    className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 focus:ring-2"
                  />
                  <div className="flex-1">
                    <span className="font-medium text-gray-900">{trail.name}</span>
                    {trail.difficulty && (
                      <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                        trail.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                        trail.difficulty === 'Intermediate' ? 'bg-blue-100 text-blue-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {trail.difficulty}
                      </span>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
        </div>
        {errors.trailIds && (
          <p className="text-red-500 text-sm mt-2">{errors.trailIds.message}</p>
        )}
        {selectedTrailIds.length > 0 && (
          <p className="text-sm text-gray-600 mt-2">
            {selectedTrailIds.length} {selectedTrailIds.length === 1 ? 'trail' : 'trails'} selected
          </p>
        )}
      </div>

      {/* Date and Duration Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="date" className="block text-sm font-semibold text-gray-900 mb-2">
            Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            id="date"
            {...register('date')}
            min={new Date().toISOString().split('T')[0]}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-gray-900 placeholder:text-gray-500"
          />
          {errors.date && (
            <p className="text-red-500 text-sm mt-2">{errors.date.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="duration" className="block text-sm font-semibold text-gray-900 mb-2">
            Duration (minutes) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            id="duration"
            min="1"
            {...register('durationMin', { valueAsNumber: true })}
            placeholder="120"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-gray-900 placeholder:text-gray-500"
          />
          {errors.durationMin && (
            <p className="text-red-500 text-sm mt-2">{errors.durationMin.message}</p>
          )}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="notes" className="block text-sm font-semibold text-gray-900 mb-2">
          Notes <span className="text-gray-600 font-normal">(optional)</span>
        </label>
        <textarea
          id="notes"
          {...register('notes')}
          rows={4}
          placeholder="Add any additional details about the ride, meeting point, what to bring, etc."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-none text-gray-900 placeholder:text-gray-500"
        />
      </div>

      {/* Submit Button */}
      <div className="pt-4">
        <button
          type="submit"
          className="w-full md:w-auto px-8 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Create Ride
        </button>
      </div>
    </form>
  );
}
