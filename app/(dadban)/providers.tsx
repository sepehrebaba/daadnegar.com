"use client";

import { DirectionProvider } from "@radix-ui/react-direction";
import { ThemeProvider } from "@/components/theme-provider";
import { AppProvider } from "@/context/app-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <DirectionProvider dir="rtl">
        <AppProvider>{children}</AppProvider>
      </DirectionProvider>
    </ThemeProvider>
  );
}
