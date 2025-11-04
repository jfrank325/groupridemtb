"use client";

import { type Ride } from "../hooks/useRides";
import { MessageForm } from "./MessageForm";
import { useUser } from "../context/UserContext";
import { useState, useEffect } from "react";

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
  const { session } = useUser();
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  useEffect(() => {
    async function fetchCurrentUserId() {
      if (session?.user?.email) {
        try {
          const res = await fetch("/api/user");
          if (res.ok) {
            const user = await res.json();
            setCurrentUserId(user.id);
          }
        } catch (error) {
          console.error("Failed to fetch current user", error);
        }
      }
    }
    fetchCurrentUserId();
  }, [session]);

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

  return (
    <>
      {ride && (
        <div className="p-4 text-gray-700">
          <h2 className="text-2xl font-semibold mb-4 text-gray-900">{ride.name || "Untitled Ride"}</h2>
          <p className="mb-2">
            {new Date(ride.date).toLocaleDateString('en-us', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })} @ {new Date(ride.date).toLocaleTimeString('en-us', { 
              timeStyle: 'short', 
              hour12: true 
            })}
          </p>
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
          <h3 className="font-semibold mb-2">Trails:</h3>
          <ul className="list-disc list-inside mb-4">
            {ride.trailNames.map((trailName) => (
              <li key={trailName}>{trailName}</li>
            ))}
          </ul>
          <p className="text-gray-600 mb-4">
            Attendees: {ride.attendees.length}
            {hasJoined && (
              <span className="ml-2 text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full">
                You're attending
              </span>
            )}
          </p>
          <div className="flex gap-2 flex-wrap">
            {showJoinButton && (
              <button 
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium" 
                onClick={() => joinRide()}
              >
                Join Ride
              </button>
            )}
            {session && (
              <button 
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium" 
                onClick={() => setShowMessageForm(!showMessageForm)}
              >
                {showMessageForm ? "Cancel" : "Message About Ride"}
              </button>
            )}
          </div>
          {/* Messages Section */}
          {session && (
            <div className="mt-6 border-t border-gray-200 pt-6">
              <h3 className="font-semibold mb-4 text-gray-900">Messages</h3>
              {loadingMessages ? (
                <div className="text-center py-4 text-gray-500">Loading messages...</div>
              ) : messages.length === 0 ? (
                <div className="text-center py-4 text-gray-500">No messages yet. Start the conversation!</div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto mb-4">
                  {messages.map((message) => {
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
                            {message.sender.name} • {new Date(message.createdAt).toLocaleString()}
                          </div>
                          <div className="break-words">{message.content}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {showMessageForm && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold mb-2">Send Message About This Ride</h4>
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
                  onClick={() => setShowMessageForm(true)}
                >
                  Add Message
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}