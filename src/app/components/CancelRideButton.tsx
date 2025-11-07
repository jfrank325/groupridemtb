'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { cancelRide } from '../actions/cancelRide';

interface CancelRideButtonProps {
  rideId: string;
}

export function CancelRideButton({ rideId }: CancelRideButtonProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleCancel = () => {
    setError(null);
    startTransition(async () => {
      const result = await cancelRide(rideId);
      if (result && 'error' in result && result.error) {
        setError(result.error);
        return;
      }

      router.push('/rides');
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col items-stretch gap-2">
      <button
        type="button"
        onClick={handleCancel}
        disabled={isPending}
        className="inline-flex items-center justify-center rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-red-300"
      >
        {isPending ? 'Cancelling...' : 'Cancel Ride'}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

