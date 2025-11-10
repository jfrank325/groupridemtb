"use client";

import { useState, useTransition } from "react";

interface UserNotificationPreferencesProps {
  initialEmailEnabled: boolean;
  initialNotifyLocalRides: boolean;
  initialNotifyRideCancellations: boolean;
  initialNotifyRideMessages: boolean;
  initialNotifyDirectMessages: boolean;
  initialRadius: number | null;
}

const DEFAULT_RADIUS = 25;

export function UserNotificationPreferences({
  initialEmailEnabled,
  initialNotifyLocalRides,
  initialNotifyRideCancellations,
  initialNotifyRideMessages,
  initialNotifyDirectMessages,
  initialRadius,
}: UserNotificationPreferencesProps) {
  const [emailEnabled, setEmailEnabled] = useState<boolean>(initialEmailEnabled);
  const [notifyLocalRides, setNotifyLocalRides] = useState<boolean>(
    initialEmailEnabled ? initialNotifyLocalRides : false,
  );
  const [notifyRideCancellations, setNotifyRideCancellations] =
    useState<boolean>(initialEmailEnabled ? initialNotifyRideCancellations : false);
  const [notifyRideMessages, setNotifyRideMessages] = useState<boolean>(
    initialEmailEnabled ? initialNotifyRideMessages : false,
  );
  const [notifyDirectMessages, setNotifyDirectMessages] = useState<boolean>(
    initialEmailEnabled ? initialNotifyDirectMessages : false,
  );
  const [radiusInput, setRadiusInput] = useState<string>(
    initialRadius ? String(initialRadius) : "",
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const trackClasses = (isOn: boolean, disabled?: boolean) =>
    [
      "inline-block h-6 w-11 rounded-full transition-colors",
      disabled ? "bg-gray-200" : isOn ? "bg-emerald-500" : "bg-gray-300",
    ].join(" ");

  const knobClasses = (isOn: boolean) =>
    [
      "pointer-events-none absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
      isOn ? "translate-x-5" : "",
    ].join(" ");

  const renderToggle = ({
    checked,
    disabled,
    onChange,
    name,
  }: {
    checked: boolean;
    disabled?: boolean;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    name: string;
  }) => (
    <label className="relative inline-flex h-6 w-11 items-center">
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        name={name}
      />
      <span className={trackClasses(checked, disabled)} aria-hidden="true" />
      <span className={knobClasses(checked)} aria-hidden="true" />
    </label>
  );

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setError(null);

    const trimmedRadius = radiusInput.trim();
    const parsedRadius = trimmedRadius ? Number.parseInt(trimmedRadius, 10) : null;
    const resolvedRadius =
      emailEnabled && notifyLocalRides && !trimmedRadius
        ? DEFAULT_RADIUS
        : parsedRadius;

    if (emailEnabled && notifyLocalRides) {
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
            emailNotificationsEnabled: emailEnabled,
            notifyLocalRides,
            notifyRideCancellations,
            notifyRideMessages,
            notifyDirectMessages,
            notificationRadiusMiles:
              emailEnabled && notifyLocalRides ? resolvedRadius : null,
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
      <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2">
        <div>
          <p className="text-sm font-medium text-gray-900">
            Email notifications
          </p>
          <p className="text-xs text-gray-500">
            Toggle all emails on or off. You can manage individual categories when enabled.
          </p>
        </div>
        {renderToggle({
          checked: emailEnabled,
          onChange: (event) => {
            const checked = event.target.checked;
            setEmailEnabled(checked);
            if (!checked) {
              setNotifyLocalRides(false);
              setNotifyRideCancellations(false);
              setNotifyRideMessages(false);
              setNotifyDirectMessages(false);
            } else {
              setNotifyLocalRides(true);
              setNotifyRideCancellations(true);
              setNotifyRideMessages(true);
              setNotifyDirectMessages(true);
              if (!radiusInput.trim()) {
                setRadiusInput(String(DEFAULT_RADIUS));
              }
            }
          },
          name: "emailNotificationsEnabled",
        })}
      </div>

      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-gray-900">
            Notify me about new local rides
          </p>
          <p className="text-xs text-gray-500">
            Receive an email when a new ride is created near your saved location.
          </p>
        </div>
        {renderToggle({
          checked: emailEnabled && notifyLocalRides,
          disabled: !emailEnabled,
          onChange: (event) => {
            if (!emailEnabled) return;
            const checked = event.target.checked;
            setNotifyLocalRides(checked);
            if (checked && !radiusInput.trim()) {
              setRadiusInput(String(DEFAULT_RADIUS));
            }
          },
          name: "notifyLocalRides",
        })}
      </div>

      {emailEnabled && notifyLocalRides && (
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

      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-gray-900">
            Ride cancellations
          </p>
          <p className="text-xs text-gray-500">
            Get notified when a ride you&apos;re attending is cancelled.
          </p>
        </div>
        {renderToggle({
          checked: emailEnabled && notifyRideCancellations,
          disabled: !emailEnabled,
          onChange: (event) => {
            if (!emailEnabled) return;
            setNotifyRideCancellations(event.target.checked);
          },
          name: "notifyRideCancellations",
        })}
      </div>

      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-gray-900">
            Ride conversations
          </p>
          <p className="text-xs text-gray-500">
            Email me if there are new messages on rides I&apos;m hosting or attending (at most once every 24 hours).
          </p>
        </div>
        {renderToggle({
          checked: emailEnabled && notifyRideMessages,
          disabled: !emailEnabled,
          onChange: (event) => {
            if (!emailEnabled) return;
            setNotifyRideMessages(event.target.checked);
          },
          name: "notifyRideMessages",
        })}
      </div>

      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-gray-900">
            Direct messages
          </p>
          <p className="text-xs text-gray-500">
            Receive direct message alerts from other riders (no more than once every 24 hours per rider).
          </p>
        </div>
        {renderToggle({
          checked: emailEnabled && notifyDirectMessages,
          disabled: !emailEnabled,
          onChange: (event) => {
            if (!emailEnabled) return;
            setNotifyDirectMessages(event.target.checked);
          },
          name: "notifyDirectMessages",
        })}
      </div>

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

