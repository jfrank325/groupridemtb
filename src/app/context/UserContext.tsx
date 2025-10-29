'use client';

import { createContext, useContext } from "react";
import type { Session } from "next-auth";

interface UserContextType {
  session: Session | null;
}

const UserContext = createContext<UserContextType>({
  session: null,
});

export function UserProvider({
  children,
  session,
}: {
  children: React.ReactNode;
  session: Session | null;
}) {
  return (
    <UserContext.Provider value={{ session }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
