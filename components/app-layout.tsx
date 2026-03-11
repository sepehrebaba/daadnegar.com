"use client";

import { useApp } from "@/context/app-context";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Languages } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Shield, HelpCircle } from "lucide-react";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { state, navigate } = useApp();

  return (
    <div className="bg-background flex min-h-screen flex-col">
      {/* Header - visible on all pages */}
      <header className="border-border bg-background/95 supports-backdrop-filter:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur">
        <div className="container flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Image src="/icon.svg" alt="دادبان" width={36} height={36} className="h-9 w-9" />
            <span className="text-foreground text-lg font-bold">دادبان</span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <Languages className="h-4 w-4" />
                {state.language === "fa" ? "فارسی" : "English"}
                <svg
                  className="h-4 w-4 shrink-0 opacity-50"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="bottom">
              <DropdownMenuCheckboxItem
                checked={state.language === "fa"}
                onCheckedChange={() => setLanguage("fa")}
              >
                فارسی
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={state.language === "en"}
                onCheckedChange={() => setLanguage("en")}
              >
                English
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main content */}
      <main className="flex flex-1 flex-col">{children}</main>

      {/* Footer - visible on all pages */}
      <footer className="border-border bg-muted/30 border-t px-4 py-2">
        {/* Links below the card */}
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Button
            onClick={() => navigate("about")}
            variant="link"
            className="text-muted-foreground gap-2"
          >
            <HelpCircle className="h-4 w-4" />
            ما چه کاری انجام می‌دهیم؟
          </Button>
          <Button
            onClick={() => navigate("security")}
            variant="link"
            className="text-muted-foreground gap-2"
          >
            <Shield className="h-4 w-4" />
            نگرانی‌های امنیتی
          </Button>
        </div>

        <div className="text-muted-foreground/70 container mx-auto mb-2 text-center text-xs">
          <p>
            © {new Date().getFullYear()} دادبان — ما اینجا هستیم تا مطمئن شویم هیچ‌کس از عدالت فرار
            نمی‌کند
          </p>
        </div>
      </footer>
    </div>
  );
}
