"use client";

import { ThemeProvider } from "@/components/theme-provider";
import { AppProvider } from "@/context/app-context";
import { DirectionProvider } from "@/components/direction-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <AppProvider>
        <DirectionProvider>{children}</DirectionProvider>
      </AppProvider>
    </ThemeProvider>
  );
}
