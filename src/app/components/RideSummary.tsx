"use client";

import { type Ride } from "../hooks/useRides";
import { MessageForm } from "./MessageForm";
import { useUser } from "../context/UserContext";
import { useState, useEffect } from "react";

export const RideSummary = ({ ride }: { ride: Ride }) => {
  const { session } = useUser();
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

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

  const handleMessageSent = () => {
    setShowMessageForm(false);
    alert("Message sent!");
  };

  return (
    <>
      {ride && (
        <div className="p-4">
          <h2 className="text-2xl font-semibold mb-4">{ride.name || "Untitled Ride"}</h2>
          <p className="text-gray-600 mb-2">
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
            <p className="text-gray-600 mb-2">Host: {ride.host.name}</p>
          )}
          {ride.notes && (
            <p className="text-gray-700 mb-4">{ride.notes}</p>
          )}
          <h3 className="font-semibold mb-2">Trails:</h3>
          <ul className="list-disc list-inside mb-4">
            {ride.trailNames.map((trailName) => (
              <li key={trailName}>{trailName}</li>
            ))}
          </ul>
          <p className="text-gray-600 mb-4">
            Attendees: {ride.attendees.length}
          </p>
          <div className="flex gap-2">
            <button 
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600" 
              onClick={() => joinRide()}
            >
              Join Ride
            </button>
            {session && (
              <button 
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600" 
                onClick={() => setShowMessageForm(!showMessageForm)}
              >
                {showMessageForm ? "Cancel" : "Message About Ride"}
              </button>
            )}
          </div>
          {showMessageForm && session && (
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
        </div>
      )}
    </>
  );
}