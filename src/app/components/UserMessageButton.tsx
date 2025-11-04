"use client";

import { useState } from "react";
import { MessageForm } from "./MessageForm";
import BasicButton from "./BasicButton";

interface UserMessageButtonProps {
  userId: string;
  userName: string;
}

export function UserMessageButton({ userId, userName }: UserMessageButtonProps) {
  const [showMessageForm, setShowMessageForm] = useState(false);

  const handleMessageSent = () => {
    setShowMessageForm(false);
    alert("Message sent!");
  };

  return (
    <div>
      {!showMessageForm ? (
        <BasicButton onClick={() => setShowMessageForm(true)}>
          Message {userName}
        </BasicButton>
      ) : (
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-semibold">Send Message to {userName}</h4>
            <button
              onClick={() => setShowMessageForm(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          <MessageForm
            recipientIds={[userId]}
            onSent={handleMessageSent}
            placeholder={`Send a message to ${userName}...`}
          />
        </div>
      )}
    </div>
  );
}

