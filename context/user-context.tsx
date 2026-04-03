"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { User } from "@/types";
import { getInviteToken, clearInviteTokenStorage } from "@/lib/edyen";
import { authClient } from "@/lib/auth-client";
import { routes } from "@/lib/routes";

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
}

const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({
  children,
  initialUser = null,
}: {
  children: ReactNode;
  initialUser?: User | null;
}) {
  const [user, setUserState] = useState<User | null>(initialUser);

  const setUser = useCallback((u: User | null) => {
    setUserState(u);
  }, []);

  const logout = useCallback(async () => {
    const token = getInviteToken();
    if (token) {
      await fetch("/api/me/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });
    }
    await authClient.signOut();
    if (typeof window !== "undefined") {
      clearInviteTokenStorage();
      sessionStorage.setItem("daadnegar_logout_toast", "1");
    }
    setUserState(null);
    window.location.href = routes.home;
  }, []);

  return <UserContext.Provider value={{ user, setUser, logout }}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used within UserProvider");
  return context;
}
