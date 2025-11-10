'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { formatDate, formatTime } from '@/lib/utils';
import Modal from './Modal';
import { rideSchema, RideFormData } from '@/lib/validation/rideSchema';
import { Trail } from '../hooks/useTrails';
import { createRide } from '../actions/createRide';
import { ShareRideButton } from './ShareRideButton';

type NewRideFormProps = {
  initialTrailId?: string | null;
  trails: Partial<Trail>[];
};

export function NewRideForm({ initialTrailId, trails }: NewRideFormProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successRide, setSuccessRide] = useState<{
    id: string;
    name: string | null;
    date: string;
    location: string | null;
    trailNames: string[];
    recurrenceLabel: string | null;
  } | null>(null);

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
    formState: { errors },
    watch,
    reset,
  } = useForm<RideFormData>({
    resolver: zodResolver(rideSchema),
    defaultValues: {
      name: '',
      trailIds: initialTrailId ? [initialTrailId] : [],
      date: '',
      time: '08:00',
      durationMin: 120,
      notes: '',
      location: '',
      recurrence: 'none',
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

  const buildShareUrl = (rideId: string) => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin.replace(/\/$/, '')}/rides/${rideId}`;
    }
    const envOrigin =
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ?? '';
    return envOrigin ? `${envOrigin}/rides/${rideId}` : `/rides/${rideId}`;
  };

  const onSubmit = async (data: RideFormData) => {
    setSubmitError(null);
    setIsSubmitting(true);

    const formData = new FormData();
    if (data.name?.trim()) {
      formData.append('name', data.name.trim());
    }

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

    if (data.recurrence && data.recurrence !== 'none') {
      formData.append('recurrence', data.recurrence);
    }

    try {
      const result = await createRide(formData);

      if (result && 'error' in result && result.error) {
        const errorValue = result.error;
        let message = 'Failed to create ride. Please try again.';

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
        return;
      }

      if (result && 'ride' in result && result.ride) {
        const created = result.ride;
        const rideDateIso = created.date instanceof Date ? created.date.toISOString() : String(created.date);
        const trailNames = (data.trailIds || []).map((id) => trailsById.get(id)?.name || 'Selected Trail');
        const createdLocation = (created as { location?: string | null }).location ?? null;

        setSuccessRide({
          id: created.id,
          name: created.name ?? data.name?.trim() ?? null,
          date: rideDateIso,
          location: createdLocation ?? data.location ?? null,
          trailNames,
          recurrenceLabel:
            data.recurrence && data.recurrence !== 'none'
              ? recurrenceLabels[data.recurrence]
              : null,
        });

        reset({
          name: '',
          trailIds: [],
          date: '',
          time: '08:00',
          durationMin: 120,
          notes: '',
          location: '',
          recurrence: 'none',
        });
        setSearchTerm('');
      }
    } catch (error) {
      console.error('Failed to create ride', error);
      setSubmitError('Unexpected error creating ride. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedTrailIds = watch('trailIds') || [];
  const locationValue = (watch('location') || '').trim();

  const successShareUrl = successRide ? buildShareUrl(successRide.id) : null;
  const successShareDescription = successRide
    ? `Join me${successRide.location ? ` at ${successRide.location}` : ''} on ${formatDate(successRide.date, { includeWeekday: true })}.`
    : null;

  useEffect(() => {
    if (!locationValue && selectedTrailIds.length > 0) {
      const firstSelected = trails.find((trail) => trail.id === selectedTrailIds[0]);
      if (firstSelected?.location) {
        setValue('location', firstSelected.location, { shouldDirty: true, shouldTouch: true });
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

    if (allowedTrailIds.size === 0) {
      return;
    }

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
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      {/* Ride Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-semibold text-gray-900 mb-2">
          Ride Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="name"
          placeholder="e.g., Saturday Morning Ride, Epic Trail Adventure"
          {...register('name')}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-gray-900 placeholder:text-gray-500"
        />
        {errors.name && (
          <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
        )}
      </div>

      {/* Location Selection */}
      <div>
        <label htmlFor="location" className="block text-sm font-semibold text-gray-900 mb-2">
          Trail System / Location
        </label>
        <input
          id="location"
          list="location-options"
          placeholder="Select or enter a location"
          {...register('location')}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        />
        <datalist id="location-options">
          {locationOptions.map((option) => (
            <option key={option} value={option} />
          ))}
        </datalist>
        <p className="mt-2 text-xs text-gray-500">
          Pick from known locations or type a custom spot if it isn&apos;t listed. You can optionally choose specific trails within that system below.
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

      {/* Date, Time, Duration */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
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
          <label htmlFor="time" className="block text-sm font-semibold text-gray-900 mb-2">
            Time <span className="text-red-500">*</span>
          </label>
          <input
            type="time"
            id="time"
            {...register('time')}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-gray-900 placeholder:text-gray-500"
          />
          {errors.time && (
            <p className="text-red-500 text-sm mt-2">{errors.time.message}</p>
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

      {/* Recurrence */}
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
          Choose how often this ride should repeat. We&apos;ll add the recurrence to the ride notes for reference.
        </p>
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
          disabled={isSubmitting}
          className="w-full md:w-auto px-8 py-3 bg-emerald-600 text-white font-semibold rounded-lg transition-colors shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:text-gray-600 disabled:shadow-none disabled:cursor-not-allowed"
          aria-busy={isSubmitting}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          {isSubmitting ? 'Creating...' : 'Create Ride'}
        </button>
      </div>
        {submitError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {submitError}
          </div>
        )}
      </form>

      <Modal isOpen={!!successRide} onClose={() => setSuccessRide(null)}>
      {successRide && (
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Ride Created</h3>
              <p className="text-sm text-gray-600">Your ride is live and visible to other riders.</p>
            </div>
            <button
              onClick={() => setSuccessRide(null)}
              className="text-gray-400 hover:text-gray-600 focus:outline-none"
              aria-label="Close"
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 8.586l3.95-3.95a1 1 0 111.414 1.414L11.414 10l3.95 3.95a1 1 0 01-1.414 1.414L10 11.414l-3.95 3.95a1 1 0 01-1.414-1.414L8.586 10l-3.95-3.95A1 1 0 016.05 4.636L10 8.586z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          <div className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm text-gray-700">
              <span className="font-medium text-gray-900">Name:</span> {successRide.name || 'Untitled Ride'}
            </p>
            <p className="text-sm text-gray-700">
              <span className="font-medium text-gray-900">Date:</span> {formatDate(successRide.date, { includeWeekday: true })}
            </p>
            <p className="text-sm text-gray-700">
              <span className="font-medium text-gray-900">Time:</span> {formatTime(successRide.date)}
            </p>
            {successRide.location && (
              <p className="text-sm text-gray-700">
                <span className="font-medium text-gray-900">Location:</span> {successRide.location}
              </p>
            )}
            {successRide.trailNames.length > 0 && (
              <p className="text-sm text-gray-700">
                <span className="font-medium text-gray-900">Trails:</span> {successRide.trailNames.join(', ')}
              </p>
            )}
            {successRide.recurrenceLabel && (
              <p className="text-sm text-gray-700">
                <span className="font-medium text-gray-900">Recurrence:</span> {successRide.recurrenceLabel}
              </p>
            )}
          </div>

          {successShareUrl && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-4">
              <p className="text-sm font-medium text-gray-900">Share this ride</p>
              <p className="mt-1 text-xs text-gray-600">
                Invite friends or teammates to join you on the trail.
              </p>
              <div className="mt-3">
                <ShareRideButton
                  url={successShareUrl}
                  title={`Ride: ${successRide.name || 'Group Ride'}`}
                  description={successShareDescription ?? undefined}
                  align="left"
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Link
              href={`/rides/${successRide.id}`}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
            >
              View Ride Details
            </Link>
            <button
              onClick={() => setSuccessRide(null)}
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
            >
              Close
            </button>
          </div>
        </div>
      )}
      </Modal>
    </>
  );
}
