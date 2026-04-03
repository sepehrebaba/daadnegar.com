"use client";

import { useEffect } from "react";
import { DirectionProvider as RadixDirectionProvider } from "@radix-ui/react-direction";
import { useLanguage } from "@/context/language-context";

function dirFromLang(lang: string): "ltr" | "rtl" {
  return lang === "fa" ? "rtl" : "ltr";
}

export function DirectionProvider({ children }: { children: React.ReactNode }) {
  const { language } = useLanguage();
  const dir = dirFromLang(language);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.dir = dir;
    document.documentElement.lang = language === "fa" ? "fa" : "en";
  }, [dir, language]);

  return <RadixDirectionProvider dir={dir}>{children}</RadixDirectionProvider>;
}
