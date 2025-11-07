"use client";

import { useEffect, useState } from "react";
import { MessageForm } from "./MessageForm";
import Link from "next/link";
import { useUser } from "@/app/context/UserContext";
import { formatDate, formatDateShort } from "@/lib/utils";

interface User {
  id: string;
  name: string;
  email: string;
}

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
  const { user } = useUser();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNewMessageForm, setShowNewMessageForm] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  
  const currentUserId = user?.id || null;

  useEffect(() => {
    fetchConversations();
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Failed to fetch users", error);
    }
  };

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
    // If sending new message, reset form
    if (showNewMessageForm) {
      setShowNewMessageForm(false);
      setSelectedUserIds([]);
    }
  };

  const handleUserToggle = (userId: string) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  if (loading) {
    return <div className="text-center py-8">Loading messages...</div>;
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-200px)]">
      {/* Conversations List */}
      <div className="lg:w-1/3 border border-gray-200 rounded-lg bg-white overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Conversations</h2>
            <button
              onClick={() => setShowNewMessageForm(!showNewMessageForm)}
              className="px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
            >
              {showNewMessageForm ? "Cancel" : "New Message"}
            </button>
          </div>
        </div>
        {showNewMessageForm && (
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-sm font-semibold mb-3">Select Recipients</h3>
            <div className="max-h-48 overflow-y-auto space-y-2 mb-4">
              {users.length === 0 ? (
                <p className="text-sm text-gray-500">Loading users...</p>
              ) : (
                users.map((user) => (
                  <label
                    key={user.id}
                    className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 p-2 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={selectedUserIds.includes(user.id)}
                      onChange={() => handleUserToggle(user.id)}
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-sm text-gray-700">{user.name}</span>
                    <span className="text-xs text-gray-500">({user.email})</span>
                  </label>
                ))
              )}
            </div>
            {selectedUserIds.length > 0 && (
              <div className="pt-4 border-t border-gray-200">
                <h4 className="text-sm font-semibold mb-2">Send Message</h4>
                <MessageForm
                  recipientIds={selectedUserIds}
                  onSent={handleMessageSent}
                  placeholder="Type your message..."
                />
              </div>
            )}
          </div>
        )}
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-700">No conversations yet</div>
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
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 focus:outline-none focus:bg-gray-50 transition-colors ${
                    selectedConversation?.id === conversation.id ? "bg-emerald-50 border-l-4 border-l-emerald-600" : ""
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
                      <p className="text-xs text-gray-600 mt-1">
                        {conversation.lastMessage
                          ? formatDateShort(conversation.lastMessage.createdAt)
                          : ""}
                      </p>
                    </div>
                    {conversation.unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center ml-2" suppressHydrationWarning>
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
                  className="text-sm text-emerald-600 hover:text-emerald-700 hover:underline focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 rounded"
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
                            ? "bg-emerald-600 text-white"
                            : "bg-gray-100 text-gray-900 border border-gray-200"
                        }`}
                      >
                        <div className={`text-xs mb-1 ${isSender ? 'text-white opacity-90' : 'text-gray-600'}`}>
                          {message.sender.name} • {formatDate(message.createdAt, { includeTime: true, hour12: true })}
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

