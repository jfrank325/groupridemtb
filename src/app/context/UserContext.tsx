'use client';

import { createContext, useContext, useState, useEffect } from "react";
import type { Session } from "next-auth";

interface User {
  id: string;
  name: string | null;
  email: string;
  favoriteTrails?: Array<{ id: string }>;
  lat?: number | null;
  lng?: number | null;
  notifyLocalRides?: boolean | null;
  notificationRadiusMiles?: number | null;
  emailNotificationsEnabled?: boolean | null;
  notifyRideCancellations?: boolean | null;
  notifyRideMessages?: boolean | null;
  notifyDirectMessages?: boolean | null;
}

interface UserContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  error: string | null;
  unreadMessageCount: number;
  refreshUnreadCount: () => void;
}

const UserContext = createContext<UserContextType>({
  session: null,
  user: null,
  loading: false,
  error: null,
  unreadMessageCount: 0,
  refreshUnreadCount: () => {},
});

export function UserProvider({
  children,
  session,
}: {
  children: React.ReactNode;
  session: Session | null;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);

  useEffect(() => {
    async function fetchUser() {
      if (!session?.user?.email) {
        setUser(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/user");
        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
        } else {
          setError("Failed to fetch user");
          setUser(null);
        }
      } catch (err) {
        console.error("Failed to fetch user", err);
        setError("Failed to fetch user");
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, [session]);

  // Centralized unread message count polling - only one interval for the entire app
  useEffect(() => {
    if (!session) {
      setUnreadMessageCount(0);
      return;
    }

    async function fetchUnreadCount() {
      try {
        const res = await fetch("/api/messages/unread-count");
        if (res.ok) {
          const data = await res.json();
          setUnreadMessageCount(data.count || 0);
        }
      } catch (error) {
        console.error("Failed to fetch unread count", error);
      }
    }

    fetchUnreadCount();
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [session]);

  const refreshUnreadCount = async () => {
    if (!session) return;
    try {
      const res = await fetch("/api/messages/unread-count");
      if (res.ok) {
        const data = await res.json();
        setUnreadMessageCount(data.count || 0);
      }
    } catch (error) {
      console.error("Failed to fetch unread count", error);
    }
  };

  return (
    <UserContext.Provider value={{ session, user, loading, error, unreadMessageCount, refreshUnreadCount }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
