"use client";

import { useEffect } from "react";
import { DirectionProvider as RadixDirectionProvider } from "@radix-ui/react-direction";
import { useApp } from "@/context/app-context";

function dirFromLang(lang: string): "ltr" | "rtl" {
  return lang === "fa" ? "rtl" : "ltr";
}

export function DirectionProvider({ children }: { children: React.ReactNode }) {
  const { state } = useApp();
  const dir = dirFromLang(state.language);

  // Sync document direction for full page (forms, layout, etc.)
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.dir = dir;
    document.documentElement.lang = state.language === "fa" ? "fa" : "en";
  }, [dir, state.language]);

  return <RadixDirectionProvider dir={dir}>{children}</RadixDirectionProvider>;
}
