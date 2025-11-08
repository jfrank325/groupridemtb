"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { type Ride } from "../hooks/useRides";
import { MessageForm } from "./MessageForm";
import { useUser } from "../context/UserContext";
import Modal from "./Modal";
import { formatDate, formatTime, Recurrence } from "@/lib/utils";

interface Message {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    email: string;
  };
}

interface RideSummaryProps {
  ride: Ride;
  onRideUpdate?: (ride: Ride) => void;
}

type JoinRideSuccess = {
  id: string;
  name: string | null;
  date: string;
  location: string | null;
  trailNames: string[];
  recurrence: string | null;
};

export const RideSummary = ({ ride, onRideUpdate }: RideSummaryProps) => {
  const router = useRouter();
  const { session, user } = useUser();

  const [showMessageForm, setShowMessageForm] = useState(false);
  const [isMessagesCollapsed, setIsMessagesCollapsed] = useState(false);
  const [showAllMessages, setShowAllMessages] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinSuccess, setJoinSuccess] = useState<JoinRideSuccess | null>(null);

  const [localRide, setLocalRide] = useState<Ride>(ride);

  const currentUserId = user?.id || null;

  useEffect(() => {
    setLocalRide(ride);
  }, [ride]);

  useEffect(() => {
    async function fetchMessages() {
      if (!localRide?.id) return;
      setLoadingMessages(true);
      try {
        const res = await fetch(`/api/messages/ride/${localRide.id}`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data);
        }
      } catch (error) {
        console.error("Failed to fetch messages", error);
      } finally {
        setLoadingMessages(false);
      }
    }
    fetchMessages();
  }, [localRide?.id]);

  const getRecipientIds = () => {
    const recipients: string[] = [];
    if (localRide.host && currentUserId && localRide.host.id !== currentUserId) {
      recipients.push(localRide.host.id);
    }
    localRide.attendees.forEach((attendee) => {
      if (currentUserId && attendee.id !== currentUserId && !recipients.includes(attendee.id)) {
        recipients.push(attendee.id);
      }
    });
    return recipients;
  };

  const handleMessageSent = async () => {
    setShowMessageForm(false);
    try {
      const res = await fetch(`/api/messages/ride/${localRide.id}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (error) {
      console.error("Failed to refresh messages", error);
    }
  };

  const hasJoined = useMemo(() => {
    if (!currentUserId) {
      return false;
    }
    return localRide.attendees.some((attendee) => attendee.id === currentUserId);
  }, [currentUserId, localRide.attendees]);

  const isHost = currentUserId && localRide.host && localRide.host.id === currentUserId;
  const showJoinButton = session && currentUserId && !isHost && !hasJoined;
  const visibleMessages = showAllMessages ? messages : messages.slice(-3);

  const recurrenceLabels: Record<Exclude<Recurrence, "none">, string> = {
    daily: "Daily",
    weekly: "Weekly",
    monthly: "Monthly",
    yearly: "Yearly",
  };

  const recurrenceLabel =
    localRide.recurrence && localRide.recurrence !== "none"
      ? recurrenceLabels[localRide.recurrence as Exclude<Recurrence, "none">]
      : null;

  const joinRide = async () => {
    if (!localRide?.id) {
      return;
    }

    if (!session) {
      const callback = encodeURIComponent(`/rides/${localRide.id}`);
      router.push(`/login?callbackUrl=${callback}&authMessage=create-ride`);
      return;
    }

    setJoinLoading(true);
    setJoinError(null);

    try {
      const res = await fetch(`/api/rides/${localRide.id}/join`, {
        method: "PUT",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to join ride");
      }

      const updatedRide: Ride = data.ride;
      setLocalRide(updatedRide);
      onRideUpdate?.(updatedRide);
      setJoinSuccess({
        id: updatedRide.id,
        name: updatedRide.name,
        date: updatedRide.date,
        location: updatedRide.location,
        trailNames: updatedRide.trailNames,
        recurrence: updatedRide.recurrence,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to join ride";
      setJoinError(message);
    } finally {
      setJoinLoading(false);
    }
  };

  const successRecurrenceLabel =
    joinSuccess && joinSuccess.recurrence && joinSuccess.recurrence !== "none"
      ? recurrenceLabels[joinSuccess.recurrence as Exclude<Recurrence, "none">]
      : null;

  return (
    <>
      {localRide && (
        <div className="p-4 text-gray-700">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <h2 className="text-2xl font-semibold text-gray-900">
              {localRide.name || "Untitled Ride"}
            </h2>
            <Link
              href={`/rides/${localRide.id}`}
              className="inline-flex items-center gap-2 rounded-lg border border-emerald-600 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
            >
              View Ride Details
            </Link>
          </div>
          {localRide.isExample && (
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-700">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden />
              Example Ride
            </div>
          )}
          <p className="mb-2">
            {formatDate(localRide.date, { includeWeekday: true })} @ {formatTime(localRide.date)}
          </p>
          {localRide.location && (
            <p className="mb-2 text-sm text-gray-600">
              Location: <span className="font-medium text-gray-900">{localRide.location}</span>
            </p>
          )}
          {recurrenceLabel && (
            <p className="mb-2 text-sm text-gray-600">
              Recurrence: <span className="font-medium text-gray-900">{recurrenceLabel}</span>
            </p>
          )}
          {localRide.host && (
            <p className="mb-2">
              Host: {localRide.host.name}
              {isHost && (
                <span className="ml-2 text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full">
                  You
                </span>
              )}
            </p>
          )}
          {localRide.notes && (
            <p className="mb-4">{localRide.notes}</p>
          )}
          {(localRide.trailNames.length > 0 || localRide.location) && (
            <div className="mb-4">
              <h3 className="font-semibold mb-2">Route Details</h3>
              {localRide.trailNames.length > 0 && (
                <ul className="list-disc list-inside mb-2">
                  {localRide.trailNames.map((trailName) => (
                    <li key={trailName}>{trailName}</li>
                  ))}
                </ul>
              )}
              {localRide.trailNames.length === 0 && localRide.location && (
                <p className="text-sm text-gray-600">
                  Meetup at <span className="font-medium text-gray-900">{localRide.location}</span>
                </p>
              )}
            </div>
          )}
          <p className="text-gray-600 mb-4">
            Attendees: {localRide.attendees.length}
            {hasJoined && (
              <span className="ml-2 text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full">
                You're attending
              </span>
            )}
          </p>
          {joinError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {joinError}
            </div>
          )}
          {showJoinButton && (
            <div className="flex gap-2 flex-wrap mb-4">
              <button
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium disabled:cursor-not-allowed disabled:bg-emerald-400"
                onClick={joinRide}
                disabled={joinLoading}
              >
                {joinLoading ? "Joining..." : "Join Ride"}
              </button>
            </div>
          )}
          {session && (
            <div className="mt-6 border-t border-gray-200 pt-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Messages</h3>
                <div className="flex items-center gap-2">
                  {messages.length > 0 && (
                    <span className="text-xs text-gray-500">{messages.length} total</span>
                  )}
                </div>
              </div>

              {!isMessagesCollapsed && (
                <div id={`ride-messages-${localRide.id}`}>
                  {loadingMessages ? (
                    <div className="text-center py-4 text-gray-500">Loading messages...</div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      No messages yet. Start the conversation!
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-96 overflow-y-auto mb-4">
                      {visibleMessages.map((message) => {
                        const isSender = message.senderId === currentUserId;
                        return (
                          <div
                            key={message.id}
                            className={`flex ${isSender ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[80%] rounded-lg p-3 ${
                                isSender
                                  ? "bg-emerald-600 text-white"
                                  : "bg-gray-100 text-gray-900 border border-gray-200"
                              }`}
                            >
                              <div
                                className={`text-xs mb-1 ${
                                  isSender ? "text-white/90" : "text-gray-600"
                                }`}
                              >
                                {message.sender.name} •{" "}
                                {formatDate(message.createdAt, { includeTime: true, hour12: true })}
                              </div>
                              <div className="break-words">{message.content}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {messages.length > 3 && !loadingMessages && (
                    <div className="mb-4">
                      <button
                        type="button"
                        className="w-full px-4 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                        onClick={() => setShowAllMessages(!showAllMessages)}
                      >
                        {showAllMessages
                          ? "Show recent messages"
                          : `Show older messages (${messages.length - 3})`}
                      </button>
                    </div>
                  )}

                  {showMessageForm && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">Send Message About This Ride</h4>
                        <button
                          type="button"
                          className="text-sm text-gray-600 hover:text-gray-900 underline"
                          onClick={() => setShowMessageForm(false)}
                        >
                          Cancel
                        </button>
                      </div>
                      <MessageForm
                        recipientIds={getRecipientIds()}
                        rideId={localRide.id}
                        label={`Ride: ${localRide.name || "Untitled Ride"}`}
                        onSent={handleMessageSent}
                        placeholder="Ask a question or share information about this ride..."
                      />
                    </div>
                  )}

                  {!showMessageForm && (
                    <button
                      className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
                      onClick={() => {
                        setIsMessagesCollapsed(false);
                        setShowMessageForm(true);
                      }}
                    >
                      Add Message
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <Modal isOpen={!!joinSuccess} onClose={() => setJoinSuccess(null)}>
        {joinSuccess && (
          <div className="space-y-4 text-gray-800">
            <div>
              <h3 className="text-xl font-semibold text-emerald-700">You're in!</h3>
              <p className="text-sm text-gray-600">
                You've been added to{" "}
                <span className="font-medium text-gray-900">
                  {joinSuccess.name || "this ride"}
                </span>.
              </p>
            </div>
            <div className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm">
              <p>
                <span className="font-medium text-gray-900">Date:</span>{" "}
                {formatDate(joinSuccess.date, { includeWeekday: true })}
              </p>
              <p>
                <span className="font-medium text-gray-900">Time:</span>{" "}
                {formatTime(joinSuccess.date)}
              </p>
              {joinSuccess.location && (
                <p>
                  <span className="font-medium text-gray-900">Location:</span>{" "}
                  {joinSuccess.location}
                </p>
              )}
              {joinSuccess.trailNames.length > 0 && (
                <p>
                  <span className="font-medium text-gray-900">Trails:</span>{" "}
                  {joinSuccess.trailNames.join(", ")}
                </p>
              )}
              {successRecurrenceLabel && (
                <p>
                  <span className="font-medium text-gray-900">Recurrence:</span>{" "}
                  {successRecurrenceLabel}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
              <button
                type="button"
                onClick={() => setJoinSuccess(null)}
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Close
              </button>
              <Link
                href={`/rides/${joinSuccess.id}`}
                className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
              >
                View Ride Details
              </Link>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};
