"use client";

import { useState, useTransition } from "react";

interface UserNotificationPreferencesProps {
  initialNotify: boolean;
  initialRadius: number | null;
}

const DEFAULT_RADIUS = 25;

export function UserNotificationPreferences({
  initialNotify,
  initialRadius,
}: UserNotificationPreferencesProps) {
  const [notifyLocalRides, setNotifyLocalRides] = useState<boolean>(initialNotify);
  const [radiusInput, setRadiusInput] = useState<string>(
    initialRadius ? String(initialRadius) : "",
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setError(null);

    const trimmedRadius = radiusInput.trim();
    const parsedRadius = trimmedRadius ? Number.parseInt(trimmedRadius, 10) : null;
    const resolvedRadius =
      notifyLocalRides && !trimmedRadius ? DEFAULT_RADIUS : parsedRadius;

    if (notifyLocalRides) {
      if (
        resolvedRadius === null ||
        !Number.isFinite(resolvedRadius) ||
        resolvedRadius < 1
      ) {
        setError("Radius must be a whole number greater than or equal to 1.");
        return;
      }
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/user/preferences", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            notifyLocalRides,
            notificationRadiusMiles: notifyLocalRides ? resolvedRadius : null,
          }),
        });

        if (!response.ok) {
          const result = await response.json().catch(() => ({}));
          if (result?.error) {
            if (typeof result.error === "string") {
              setError(result.error);
            } else if (result.error.notificationRadiusMiles?.length) {
              setError(result.error.notificationRadiusMiles[0]);
            } else if (result.error.notifyLocalRides?.length) {
              setError(result.error.notifyLocalRides[0]);
            } else {
              setError("Failed to update preferences.");
            }
          } else {
            setError("Failed to update preferences.");
          }
          return;
        }

        setMessage("Preferences updated successfully.");
      } catch (err) {
        console.error("Failed to update notification preferences", err);
        setError("An unexpected error occurred. Please try again.");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-gray-900">
            Notify me about new local rides
          </p>
          <p className="text-xs text-gray-500">
            Receive an email when a new ride is created near your saved location.
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={notifyLocalRides}
            onChange={(event) => {
              const checked = event.target.checked;
              setNotifyLocalRides(checked);
              if (checked && !radiusInput.trim()) {
                setRadiusInput(String(DEFAULT_RADIUS));
              }
            }}
          />
          <div className="w-11 h-6 bg-gray-200 rounded-full transition-colors peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-500 peer-checked:bg-emerald-600" />
          <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />
        </label>
      </div>

      {notifyLocalRides && (
        <div>
          <label
            htmlFor="notificationRadiusMiles"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Notification radius (miles)
          </label>
          <input
            id="notificationRadiusMiles"
            type="number"
            min={1}
            inputMode="numeric"
            value={radiusInput}
            onChange={(event) => setRadiusInput(event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            placeholder="Enter a radius in miles"
          />
          <p className="mt-1 text-xs text-gray-500">
            Minimum radius is 1 mile. Leave blank to use the default ({DEFAULT_RADIUS} miles).
          </p>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {message && (
        <p className="text-sm text-emerald-600" role="status">
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
      >
        {isPending ? "Saving..." : "Save preferences"}
      </button>
    </form>
  );
}

