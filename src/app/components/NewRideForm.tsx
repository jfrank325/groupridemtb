'use client';
 
import { useEffect, useMemo, useState } from 'react';
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
  const [searchTerm, setSearchTerm] = useState('');
  const locationOptions = useMemo(() => {
    const unique = new Set<string>();
    trails.forEach((trail) => {
      if (trail.location) {
        unique.add(trail.location.trim());
      }
    });
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [trails]);
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
      location: '',
    },
  });

  // Keep it reactive if search params change
  useEffect(() => {
    if (initialTrailId) {
      setValue('trailIds', [initialTrailId]);
      const initialTrail = trails.find((trail) => trail.id === initialTrailId);
      if (initialTrail?.location) {
        setValue('location', initialTrail.location, { shouldDirty: false, shouldTouch: false });
      }
    }
  }, [initialTrailId, setValue, trails]);

  const onSubmit = async (data: RideFormData) => {
    console.log('Submitted:', data);

    const formData = new FormData();
    formData.append('date', data.date);
    formData.append('durationMin', String(data.durationMin));
    if (data.notes) formData.append('notes', data.notes);
    (data.trailIds || []).forEach((id) => formData.append('trailIds', id));
    if (data.location) {
      formData.append('location', data.location);
    }

    await createRide(formData);
  };

  const selectedTrailIds = watch('trailIds') || [];
  const locationValue = (watch('location') || '').trim();

  useEffect(() => {
    if (!locationValue && selectedTrailIds.length > 0) {
      const firstSelected = trails.find((trail) => trail.id === selectedTrailIds[0]);
      if (firstSelected?.location) {
        setValue('location', firstSelected.location, { shouldDirty: true, shouldTouch: true });
      }
    }
  }, [locationValue, selectedTrailIds, setValue, trails]);

  const filteredGroups = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const locationFilter = locationValue;

    const filtered = trails.filter((trail) => {
      const matchesLocation = !locationFilter || trail.location?.trim() === locationFilter;
      if (!matchesLocation) return false;

      if (!term) return true;

      const haystack = [trail.name, trail.location, trail.difficulty]
        .filter(Boolean)
        .map((value) => value!.toLowerCase());
      return haystack.some((value) => value.includes(term));
    });

    const grouped = filtered.reduce<Record<string, Partial<Trail>[]>>((acc, trail) => {
      const location = trail.location?.trim() || 'Other Locations';
      if (!acc[location]) acc[location] = [];
      acc[location].push(trail);
      return acc;
    }, {});

    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([location, trailsInLocation]) => ({
        location,
        trails: trailsInLocation.sort((a, b) => (a.name || '').localeCompare(b.name || '')),
      }));
  }, [trails, searchTerm, locationValue]);

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

      {/* Location Selection */}
      <div>
        <label htmlFor="location" className="block text-sm font-semibold text-gray-900 mb-2">
          Trail System / Location
        </label>
        <select
          id="location"
          {...register('location')}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        >
          <option value="">Select a location</option>
          {locationOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <p className="mt-2 text-xs text-gray-500">
          Pick the location first. You can optionally choose specific trails within that system below.
        </p>
        {locationValue && (
          <p className="mt-1 text-xs font-medium text-emerald-600">
            Location set to: {locationValue}
          </p>
        )}
        {errors.location && (
          <p className="text-red-500 text-sm mt-2">{errors.location.message}</p>
        )}
      </div>

      {/* Trails Selection */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-1">
          Select Trails (optional)
        </label>
        <p className="text-xs text-gray-500 mb-2">
          Choose specific trails within the selected location. Leave blank if you&apos;re planning a meetup without named trails.
        </p>
        <div className="mb-3">
          <label htmlFor="trail-search" className="sr-only">
            Search trails
          </label>
          <input
            id="trail-search"
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by name or location"
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
          {searchTerm && (
            <p className="mt-1 text-xs text-gray-500">
              Showing results for <span className="font-medium">“{searchTerm}”</span>
            </p>
          )}
        </div>
        <div className="border border-gray-200 rounded-lg p-4 max-h-72 overflow-y-auto bg-gray-50">
          {filteredGroups.length === 0 ? (
            <p className="text-sm text-gray-500">
              {locationValue
                ? `No trails found for “${locationValue}”. Try selecting a different location or add your own route notes.`
                : 'No trails match your search. Try a different name or location.'}
            </p>
          ) : (
            <div className="space-y-5">
              {filteredGroups.map(({ location, trails: trailsInLocation }) => (
                <div key={location}>
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-700">{location}</h3>
                    <span className="text-xs text-gray-500">{trailsInLocation.length} trail{trailsInLocation.length === 1 ? '' : 's'}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {trailsInLocation.map((trail) => {
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
              ))}
            </div>
          )}
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
