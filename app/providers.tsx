"use client";

import { ThemeProvider } from "@/components/theme-provider";
import { UserProvider } from "@/context/user-context";
import { LanguageProvider } from "@/context/language-context";
import { DirectionProvider } from "@/components/direction-provider";
import { I18nProvider } from "@/components/i18n-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <UserProvider>
        <LanguageProvider>
          <I18nProvider>
            <DirectionProvider>{children}</DirectionProvider>
          </I18nProvider>
        </LanguageProvider>
      </UserProvider>
    </ThemeProvider>
  );
}
