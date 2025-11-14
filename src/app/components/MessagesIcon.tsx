"use client";

import Link from "next/link";
import { useUser } from "../context/UserContext";

export function MessagesIcon() {
  const { unreadMessageCount } = useUser();

  return (
    <Link href="/messages" className="relative cursor-pointer p-2 -m-2 rounded-lg hover:bg-gray-100 transition-colors">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5 text-gray-700"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      </svg>
      {unreadMessageCount > 0 && (
        <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center ring-2 ring-white" suppressHydrationWarning>
          {unreadMessageCount > 9 ? "9+" : unreadMessageCount}
        </span>
      )}
    </Link>
  );
}

