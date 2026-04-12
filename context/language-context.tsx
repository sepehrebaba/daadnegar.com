"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import type { Language } from "@/types";
import { useUser } from "@/context/user-context";
import { api } from "@/lib/edyen";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({
  children,
  initialLanguage = "fa",
}: {
  children: ReactNode;
  initialLanguage?: Language;
}) {
  const { user, setUser } = useUser();
  const userRef = useRef(user);
  userRef.current = user;

  const [language, setLanguageState] = useState<Language>(initialLanguage);

  useEffect(() => {
    if (!user?.preferredLanguage) return;
    setLanguageState(user.preferredLanguage);
  }, [user?.id, user?.preferredLanguage]);

  const setLanguage = useCallback(
    (lang: Language) => {
      setLanguageState(lang);
      const u = userRef.current;
      if (!u?.id) return;
      void (async () => {
        const { error } = await api.me["preferred-language"].patch({ language: lang });
        if (error) return;
        const latest = userRef.current;
        if (latest?.id === u.id) {
          setUser({ ...latest, preferredLanguage: lang });
        }
      })();
    },
    [setUser],
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
}
