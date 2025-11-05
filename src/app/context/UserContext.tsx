'use client';

import { createContext, useContext, useState, useEffect } from "react";
import type { Session } from "next-auth";

interface User {
  id: string;
  name: string | null;
  email: string;
  favoriteTrails?: Array<{ id: string }>;
}

interface UserContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  error: string | null;
}

const UserContext = createContext<UserContextType>({
  session: null,
  user: null,
  loading: false,
  error: null,
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

  return (
    <UserContext.Provider value={{ session, user, loading, error }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
