"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

interface RideAttendanceActionsProps {
  rideId: string;
  isHost: boolean;
  initialIsAttending: boolean;
  canJoin: boolean;
  loginHref: string;
  rideName?: string | null;
}

export function RideAttendanceActions({
  rideId,
  isHost,
  initialIsAttending,
  canJoin,
  loginHref,
  rideName,
}: RideAttendanceActionsProps) {
  const router = useRouter();
  const [isAttending, setIsAttending] = useState(initialIsAttending);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (isHost) {
    return null;
  }

  const handleJoin = () => {
    if (!canJoin) {
      router.push(loginHref);
      return;
    }

    startTransition(async () => {
      setError(null);
      try {
        const res = await fetch(`/api/rides/${rideId}/join`, {
          method: "PUT",
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const message =
            typeof data?.error === "string"
              ? data.error
              : "Unable to join this ride right now.";
          setError(message);
          return;
        }
        setIsAttending(true);
        router.refresh();
      } catch (err) {
        console.error("[JOIN_RIDE_ACTIONS]", err);
        setError("An unexpected error occurred while joining.");
      }
    });
  };

  const handleLeave = () => {
    startTransition(async () => {
      setError(null);
      try {
        const res = await fetch(`/api/rides/${rideId}/join`, {
          method: "DELETE",
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const message =
            typeof data?.error === "string"
              ? data.error
              : "Unable to leave this ride right now.";
          setError(message);
          return;
        }
        setIsAttending(false);
        router.refresh();
      } catch (err) {
        console.error("[LEAVE_RIDE_ACTIONS]", err);
        setError("An unexpected error occurred while leaving.");
      }
    });
  };

  const rideLabel = rideName ? `“${rideName}”` : "this ride";

  return (
    <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-3">
      {error && (
        <p className="text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
      {isAttending ? (
        <button
          type="button"
          onClick={handleLeave}
          disabled={isPending}
          className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:border-red-300 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isPending ? "Leaving..." : `Leave ${rideLabel}`}
        </button>
      ) : (
        <button
          type="button"
          onClick={handleJoin}
          disabled={isPending}
          className="inline-flex items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:border-emerald-300 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isPending ? "Joining..." : `Join ${rideLabel}`}
        </button>
      )}
    </div>
  );
}

