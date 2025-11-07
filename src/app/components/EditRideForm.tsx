'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { RideFormData, rideSchema } from '@/lib/validation/rideSchema';
import { Trail } from '@/app/hooks/useTrails';
import { updateRide } from '@/app/actions/updateRide';
import { formatDate, formatTime } from '@/lib/utils';
import { CancelRideButton } from './CancelRideButton';

type EditRideFormProps = {
  ride: {
    id: string;
    name: string | null;
    date: string;
    durationMin: number;
    notes: string | null;
    location: string | null;
    recurrence: string | null;
    trailIds: string[];
  };
  trails: Partial<Trail>[];
};

export function EditRideForm({ ride, trails }: EditRideFormProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const rideDate = new Date(ride.date);
  const defaultDate = rideDate.toISOString().slice(0, 10);
  const defaultTime = rideDate.toISOString().slice(11, 16);

  const recurrenceLabels: Record<string, string> = {
    none: 'Does not repeat',
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
    yearly: 'Yearly',
  };

  const recurrenceOptions = [
    { value: 'none', label: recurrenceLabels.none },
    { value: 'daily', label: recurrenceLabels.daily },
    { value: 'weekly', label: recurrenceLabels.weekly },
    { value: 'monthly', label: recurrenceLabels.monthly },
    { value: 'yearly', label: recurrenceLabels.yearly },
  ];

  const summaryRecurrenceLabel =
    recurrenceLabels[(ride.recurrence ?? 'none').toLowerCase()] ?? recurrenceLabels.none;

  const locationOptions = useMemo(() => {
    const unique = new Set<string>();
    trails.forEach((trail) => {
      if (trail.location) {
        unique.add(trail.location.trim());
      }
    });
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [trails]);

  const trailsById = useMemo(() => {
    const map = new Map<string, Partial<Trail>>();
    trails.forEach((trail) => {
      if (trail.id) {
        map.set(trail.id, trail);
      }
    });
    return map;
  }, [trails]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RideFormData>({
    resolver: zodResolver(rideSchema),
    defaultValues: {
      name: ride.name ?? '',
      trailIds: ride.trailIds,
      date: defaultDate,
      time: defaultTime,
      durationMin: ride.durationMin,
      notes: ride.notes ?? '',
      location: ride.location ?? '',
      recurrence: (ride.recurrence as RideFormData['recurrence']) ?? 'none',
    },
  });

  const selectedTrailIds = watch('trailIds') || [];
  const locationValue = (watch('location') || '').trim();

  useEffect(() => {
    if (!locationValue && selectedTrailIds.length > 0) {
      const firstSelected = trails.find((trail) => trail.id === selectedTrailIds[0]);
      if (firstSelected?.location) {
        setValue('location', firstSelected.location, { shouldDirty: false, shouldTouch: false });
      }
    }
  }, [locationValue, selectedTrailIds, setValue, trails]);

  useEffect(() => {
    if (!locationValue || selectedTrailIds.length === 0) {
      return;
    }

    const allowedTrailIds = new Set(
      trails
        .filter((trail) => trail.location?.trim() === locationValue)
        .map((trail) => trail.id)
        .filter((id): id is string => Boolean(id))
    );

    const filteredTrailIds = selectedTrailIds.filter((id) => allowedTrailIds.has(id));

    if (filteredTrailIds.length !== selectedTrailIds.length) {
      setValue('trailIds', filteredTrailIds, { shouldDirty: true, shouldTouch: true });
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
      const groupLocation = trail.location?.trim() || 'Other Locations';
      if (!acc[groupLocation]) acc[groupLocation] = [];
      acc[groupLocation].push(trail);
      return acc;
    }, {});

    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([location, trailsInLocation]) => ({
        location,
        trails: trailsInLocation.sort((a, b) => (a.name || '').localeCompare(b.name || '')),
      }));
  }, [trails, searchTerm, locationValue]);

  const onSubmit = async (data: RideFormData) => {
    setSubmitError(null);
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('rideId', ride.id);
    formData.append('name', data.name.trim());

    const isoDateTime = `${data.date}T${data.time}:00Z`;
    const combinedDate = new Date(isoDateTime);
    if (Number.isNaN(combinedDate.getTime())) {
      setSubmitError('Please provide a valid date and time.');
      setIsSubmitting(false);
      return;
    }

    formData.append('date', isoDateTime);
    formData.append('time', data.time);
    formData.append('durationMin', String(data.durationMin));

    if (data.notes?.trim()) {
      formData.append('notes', data.notes.trim());
    }

    (data.trailIds || []).forEach((id) => formData.append('trailIds', id));

    if (data.location?.trim()) {
      formData.append('location', data.location.trim());
    }

    formData.append('recurrence', data.recurrence ?? 'none');

    try {
      const result = await updateRide(formData);

      if (result && 'error' in result && result.error) {
        const errorValue = result.error;
        let message = 'Failed to update ride. Please try again.';

        if (typeof errorValue === 'string') {
          message = errorValue;
        } else if (typeof errorValue === 'object' && errorValue !== null) {
          const formMessages = (errorValue as Record<string, unknown>)._form;
          if (Array.isArray(formMessages) && formMessages.length > 0) {
            message = formMessages.join(', ');
          } else {
            const fieldMessage = Object.values(errorValue as Record<string, unknown>)
              .find((value) => Array.isArray(value) && value.length > 0) as string[] | undefined;
            if (fieldMessage && fieldMessage.length > 0) {
              message = fieldMessage.join(', ');
            }
          }
        }

        setSubmitError(message);
        setIsSubmitting(false);
        return;
      }

      router.push(`/rides/${ride.id}`);
      router.refresh();
    } catch (error) {
      console.error('Failed to update ride', error);
      setSubmitError('Unexpected error updating ride. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        <div>
          <label htmlFor="name" className="block text-sm font-semibold text-gray-900 mb-2">
            Ride Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            placeholder="e.g., Saturday Morning Ride"
            {...register('name')}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-gray-900 placeholder:text-gray-500"
          />
          {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
        </div>

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
            Update the location or keep it as-is. You can also choose specific trails below.
          </p>
          {locationValue && (
            <p className="mt-1 text-xs font-medium text-emerald-600">Location set to: {locationValue}</p>
          )}
          {errors.location && <p className="text-red-500 text-sm mt-2">{errors.location.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-1">
            Select Trails (optional)
          </label>
          <p className="text-xs text-gray-500 mb-2">
            Select trails for this ride. Leave empty for a general meetup at the chosen location.
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
                  ? `No trails found for “${locationValue}”. Try a different location or adjust your selection.`
                  : 'No trails match your search. Try a different query.'}
              </p>
            ) : (
              <div className="space-y-5">
                {filteredGroups.map(({ location, trails: trailsInLocation }) => (
                  <div key={location}>
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-700">{location}</h3>
                      <span className="text-xs text-gray-500">
                        {trailsInLocation.length} trail{trailsInLocation.length === 1 ? '' : 's'}
                      </span>
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
                                <span
                                  className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                                    trail.difficulty === 'Easy'
                                      ? 'bg-green-100 text-green-700'
                                      : trail.difficulty === 'Intermediate'
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'bg-red-100 text-red-700'
                                  }`}
                                >
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
          {errors.trailIds && <p className="text-red-500 text-sm mt-2">{errors.trailIds.message}</p>}
          {selectedTrailIds.length > 0 && (
            <p className="text-sm text-gray-600 mt-2">
              {selectedTrailIds.length} {selectedTrailIds.length === 1 ? 'trail' : 'trails'} selected
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div>
            <label htmlFor="date" className="block text-sm font-semibold text-gray-900 mb-2">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="date"
              {...register('date')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-gray-900"
            />
            {errors.date && <p className="text-red-500 text-sm mt-2">{errors.date.message}</p>}
          </div>

          <div>
            <label htmlFor="time" className="block text-sm font-semibold text-gray-900 mb-2">
              Time <span className="text-red-500">*</span>
            </label>
            <input
              type="time"
              id="time"
              {...register('time')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-gray-900"
            />
            {errors.time && <p className="text-red-500 text-sm mt-2">{errors.time.message}</p>}
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-gray-900"
            />
            {errors.durationMin && <p className="text-red-500 text-sm mt-2">{errors.durationMin.message}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="recurrence" className="block text-sm font-semibold text-gray-900 mb-2">
            Recurrence
          </label>
          <select
            id="recurrence"
            {...register('recurrence')}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          >
            {recurrenceOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs text-gray-500">
            Adjust how often this ride repeats. Setting it to “Does not repeat” will stop automatic rescheduling.
          </p>
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-semibold text-gray-900 mb-2">
            Notes <span className="text-gray-600 font-normal">(optional)</span>
          </label>
          <textarea
            id="notes"
            {...register('notes')}
            rows={4}
            placeholder="Update meetup details, meeting point, or preparation notes."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-none text-gray-900 placeholder:text-gray-500"
          />
        </div>

        <div className="flex flex-col gap-4 border-t border-gray-200 pt-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition-colors hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {isSubmitting ? 'Saving changes...' : 'Save Changes'}
            </button>
            <div className="flex flex-col items-start gap-2 md:items-end">
              <p className="text-xs font-semibold uppercase tracking-wide text-red-600">
                Danger zone
              </p>
              <CancelRideButton rideId={ride.id} />
            </div>
          </div>
          {submitError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {submitError}
            </div>
          )}
        </div>
      </form>

      <section className="mt-10 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Current Ride Summary</h2>
        <dl className="grid gap-3 text-sm text-gray-700">
          <div>
            <dt className="font-medium text-gray-900">Date</dt>
            <dd>{formatDate(ride.date, { includeWeekday: true })}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-900">Time</dt>
            <dd>{formatTime(ride.date)}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-900">Location</dt>
            <dd>{ride.location || 'Not specified'}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-900">Recurrence</dt>
            <dd>{summaryRecurrenceLabel}</dd>
          </div>
        </dl>
      </section>
    </>
  );
}

