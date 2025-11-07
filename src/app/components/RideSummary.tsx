"use client";

import { type Ride } from "../hooks/useRides";
import { MessageForm } from "./MessageForm";
import { useUser } from "../context/UserContext";
import { useState, useEffect } from "react";
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

export const RideSummary = ({ ride }: { ride: Ride }) => {
  const { session, user } = useUser();
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [isMessagesCollapsed, setIsMessagesCollapsed] = useState(false);
  const [showAllMessages, setShowAllMessages] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  
  const currentUserId = user?.id || null;

  useEffect(() => {
    async function fetchMessages() {
      if (!ride?.id) return;
      setLoadingMessages(true);
      try {
        const res = await fetch(`/api/messages/ride/${ride.id}`);
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
  }, [ride?.id]);

  const joinRide = () => {
    // TODO: Implement join ride functionality
  };

  const getRecipientIds = () => {
    const recipients: string[] = [];
    // Add host if not the current user
    if (ride.host && currentUserId && ride.host.id !== currentUserId) {
      recipients.push(ride.host.id);
    }
    // Add other attendees if not the current user
    ride.attendees.forEach((attendee) => {
      if (currentUserId && attendee.id !== currentUserId && !recipients.includes(attendee.id)) {
        recipients.push(attendee.id);
      }
    });
    return recipients;
  };

  const handleMessageSent = async () => {
    setShowMessageForm(false);
    // Refresh messages immediately after sending
    try {
      const res = await fetch(`/api/messages/ride/${ride.id}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (error) {
      console.error("Failed to refresh messages", error);
    }
  };

  // Check if user has already joined the ride
  const hasJoined = currentUserId && ride.attendees.some(attendee => attendee.id === currentUserId);
  // Check if user is the host
  const isHost = currentUserId && ride.host && ride.host.id === currentUserId;
  // Show join button only if user is logged in, not the host, and hasn't joined
  const showJoinButton = session && currentUserId && !isHost && !hasJoined;
  const visibleMessages = showAllMessages ? messages : messages.slice(-3);
  const recurrenceLabels: Record<Exclude<Recurrence, "none">, string> = {
    daily: "Daily",
    weekly: "Weekly",
    monthly: "Monthly",
    yearly: "Yearly",
  };
  const recurrenceLabel =
    ride.recurrence && ride.recurrence !== "none"
      ? recurrenceLabels[ride.recurrence as Exclude<Recurrence, "none">]
      : null;

  return (
    <>
      {ride && (
        <div className="p-4 text-gray-700">
          <h2 className="text-2xl font-semibold mb-4 text-gray-900">{ride.name || "Untitled Ride"}</h2>
          {ride.isExample && (
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-700">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden />
              Example Ride
            </div>
          )}
          <p className="mb-2">
            {formatDate(ride.date, { includeWeekday: true })} @ {formatTime(ride.date)}
          </p>
          {ride.location && (
            <p className="mb-2 text-sm text-gray-600">
              Location: <span className="font-medium text-gray-900">{ride.location}</span>
            </p>
          )}
          {recurrenceLabel && (
            <p className="mb-2 text-sm text-gray-600">
              Recurrence: <span className="font-medium text-gray-900">{recurrenceLabel}</span>
            </p>
          )}
          {ride.host && (
            <p className="mb-2">
              Host: {ride.host.name}
              {isHost && (
                <span className="ml-2 text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full">
                  You
                </span>
              )}
            </p>
          )}
          {ride.notes && (
            <p className="mb-4">{ride.notes}</p>
          )}
          {(ride.trailNames.length > 0 || ride.location) && (
            <div className="mb-4">
              <h3 className="font-semibold mb-2">Route Details</h3>
              {ride.trailNames.length > 0 && (
                <ul className="list-disc list-inside mb-2">
                  {ride.trailNames.map((trailName) => (
                    <li key={trailName}>{trailName}</li>
                  ))}
                </ul>
              )}
              {ride.trailNames.length === 0 && ride.location && (
                <p className="text-sm text-gray-600">
                  Meetup at <span className="font-medium text-gray-900">{ride.location}</span>
                </p>
              )}
            </div>
          )}
          <p className="text-gray-600 mb-4">
            Attendees: {ride.attendees.length}
            {hasJoined && (
              <span className="ml-2 text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full">
                You're attending
              </span>
            )}
          </p>
          {showJoinButton && (
            <div className="flex gap-2 flex-wrap mb-4">
              <button 
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium" 
                onClick={() => joinRide()}
              >
                Join Ride
              </button>
            </div>
          )}
          {/* Messages Section */}
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
                <div id={`ride-messages-${ride.id}`}>
                  {loadingMessages ? (
                    <div className="text-center py-4 text-gray-500">Loading messages...</div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">No messages yet. Start the conversation!</div>
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
                              <div className={`text-xs mb-1 ${isSender ? 'text-white opacity-90' : 'text-gray-600'}`}>
                                {message.sender.name} • {formatDate(message.createdAt, { includeTime: true, hour12: true })}
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
                        {showAllMessages ? "Show recent messages" : `Show older messages (${messages.length - 3})`}
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
                        rideId={ride.id}
                        label={`Ride: ${ride.name || "Untitled Ride"}`}
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
    </>
  );
}