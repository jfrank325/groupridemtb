"use client";

import { useState } from "react";
import BasicButton from "./BasicButton";

interface MessageFormProps {
  recipientIds: string[];
  rideId?: string;
  label?: string;
  onSent?: () => void;
  placeholder?: string;
}

export function MessageForm({
  recipientIds,
  rideId,
  label,
  onSent,
  placeholder = "Type your message...",
}: MessageFormProps) {
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || sending) return;

    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim(),
          recipientIds,
          rideId: rideId || null,
          label: label || null,
        }),
      });

      if (res.ok) {
        setContent("");
        onSent?.();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to send message");
      }
    } catch (error) {
      console.error("Failed to send message", error);
      alert("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        rows={3}
        required
      />
      <div className="flex justify-end">
        <BasicButton type="submit" disabled={sending || !content.trim()}>
          {sending ? "Sending..." : "Send Message"}
        </BasicButton>
      </div>
    </form>
  );
}

