"use client";

import { useEffect, useState } from "react";
import { MessageForm } from "./MessageForm";
import Link from "next/link";

interface Message {
  id: string;
  content: string;
  senderId: string;
  rideId: string | null;
  label: string | null;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    email: string;
  };
  recipients: Array<{
    userId: string;
    read: boolean;
    user: {
      id: string;
      name: string;
      email: string;
    };
  }>;
  ride: {
    id: string;
    name: string | null;
    host: {
      id: string;
      name: string;
    };
  } | null;
}

interface Conversation {
  id: string;
  rideId: string | null;
  ride: {
    id: string;
    name: string | null;
    host: {
      id: string;
      name: string;
    };
  } | null;
  participants: Array<{
    id: string;
    name: string;
    email: string;
  }>;
  messages: Message[];
  unreadCount: number;
  lastMessage: Message | null;
}

export function MessagesClient() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCurrentUser() {
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
    fetchCurrentUser();
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const res = await fetch("/api/messages/conversations");
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch (error) {
      console.error("Failed to fetch conversations", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (messageId: string) => {
    try {
      await fetch(`/api/messages/${messageId}/read`, {
        method: "PUT",
      });
      fetchConversations();
    } catch (error) {
      console.error("Failed to mark message as read", error);
    }
  };

  const handleMessageSent = () => {
    fetchConversations();
    if (selectedConversation) {
      // Refresh the selected conversation
      const updated = conversations.find(c => c.id === selectedConversation.id);
      if (updated) {
        setSelectedConversation(updated);
      }
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading messages...</div>;
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-200px)]">
      {/* Conversations List */}
      <div className="lg:w-1/3 border border-gray-200 rounded-lg bg-white overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-xl font-semibold">Conversations</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No conversations yet</div>
          ) : (
            conversations.map((conversation) => {
              const otherParticipants = conversation.participants.filter(
                (p) => p.id !== currentUserId
              );
              const title = conversation.ride
                ? `Ride: ${conversation.ride.name || "Untitled Ride"}`
                : otherParticipants.map((p) => p.name).join(", ") || "Conversation";

              return (
                <div
                  key={conversation.id}
                  onClick={() => {
                    setSelectedConversation(conversation);
                    // Mark messages as read when viewing
                    conversation.messages.forEach((msg) => {
                      const recipient = msg.recipients.find((r) => !r.read);
                      if (recipient) {
                        handleMarkAsRead(msg.id);
                      }
                    });
                  }}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                    selectedConversation?.id === conversation.id ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold">{title}</h3>
                      {conversation.lastMessage && (
                        <p className="text-sm text-gray-600 truncate mt-1">
                          {conversation.lastMessage.content}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {conversation.lastMessage
                          ? new Date(conversation.lastMessage.createdAt).toLocaleDateString()
                          : ""}
                      </p>
                    </div>
                    {conversation.unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center ml-2">
                        {conversation.unreadCount > 9 ? "9+" : conversation.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Messages View */}
      <div className="lg:w-2/3 border border-gray-200 rounded-lg bg-white overflow-hidden flex flex-col">
        {selectedConversation ? (
          <>
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-xl font-semibold">
                {selectedConversation.ride
                  ? `Ride: ${selectedConversation.ride.name || "Untitled Ride"}`
                  : selectedConversation.participants
                      .filter((p) => p.id !== currentUserId)
                      .map((p) => p.name)
                      .join(", ") || "Conversation"}
              </h2>
              {selectedConversation.ride && (
                <Link
                  href={`/rides/${selectedConversation.ride.id}`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  View Ride Details
                </Link>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {selectedConversation.messages
                .sort(
                  (a, b) =>
                    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                )
                .map((message) => {
                  const isSender = message.senderId === currentUserId;
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isSender ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          isSender
                            ? "bg-blue-500 text-white"
                            : "bg-gray-200 text-gray-900"
                        }`}
                      >
                        <div className="text-xs opacity-75 mb-1">
                          {message.sender.name} • {new Date(message.createdAt).toLocaleString()}
                        </div>
                        <div>{message.content}</div>
                      </div>
                    </div>
                  );
                })}
            </div>
            <div className="p-4 border-t border-gray-200">
              <MessageForm
                recipientIds={selectedConversation.participants
                  .filter((p) => p.id !== currentUserId)
                  .map((p) => p.id)}
                rideId={selectedConversation.rideId || undefined}
                label={selectedConversation.ride ? `Ride: ${selectedConversation.ride.name}` : undefined}
                onSent={handleMessageSent}
              />
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Select a conversation to view messages
          </div>
        )}
      </div>
    </div>
  );
}

