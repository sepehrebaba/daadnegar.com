"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/app-context";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Languages, House, UserCircle, Settings, Shield, HelpCircle, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { routes } from "@/lib/routes";
import {
  api,
  DADBAN_INVITE_TOKEN_KEY,
  clearInviteTokenStorage,
  setInviteTokenStorage,
} from "@/lib/edyen";
import { authClient } from "@/lib/auth-client";

const ChevronDown = () => (
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
);

export function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { state, setLanguage, setUser } = useApp();
  const user = state.user;

  const handleLogout = async () => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem(DADBAN_INVITE_TOKEN_KEY) : null;
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
    }
    setUser(null);
    router.push(routes.home);
  };

  // Sync invite token from localStorage to cookie (for middleware) when token exists
  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem(DADBAN_INVITE_TOKEN_KEY);
    if (token) setInviteTokenStorage(token);
  }, []);

  // بارگذاری کاربر هنگام وجود auth (invite token یا session cookie)
  useEffect(() => {
    if (user) return;
    const hasAuth =
      typeof window !== "undefined" &&
      (localStorage.getItem(DADBAN_INVITE_TOKEN_KEY) || document.cookie.includes("better-auth"));
    if (!hasAuth) return;
    let cancelled = false;
    api.me.get().then(({ data, error }) => {
      if (cancelled || error || !data) return;
      setUser({
        id: data.id,
        passkey: "",
        inviteCode: data.inviteCode ?? "",
        isActivated: true,
        tokensCount: data.tokensCount ?? 0,
        approvedRequestsCount: data.approvedRequestsCount ?? 0,
      } as Parameters<typeof setUser>[0]);
    });
    return () => {
      cancelled = true;
    };
  }, [user, setUser]);

  return (
    <div className="bg-background flex min-h-screen flex-col">
      {/* Header - visible on all pages */}
      <header className="border-border bg-background/95 supports-backdrop-filter:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur">
        <div className="container flex h-14 items-center justify-between px-4">
          <Link href={routes.home} className="flex items-center gap-2">
            <Image src="/logo.png" alt="دادبان" width={36} height={36} className="h-9 w-9" />
            <span className="text-foreground text-lg font-bold">دادبان</span>
          </Link>
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <UserCircle className="h-4 w-4" />
                  پنل کاربری
                  <ChevronDown />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="bottom" align="end">
                <DropdownMenuItem asChild>
                  <Link href={routes.mainMenu} className="flex items-center gap-2">
                    <UserCircle className="h-4 w-4" />
                    پنل کاربری
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={routes.settings} className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    تنظیمات
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={handleLogout} className="gap-2">
                  <LogOut className="h-4 w-4" />
                  خروج
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <Languages className="h-4 w-4" />
                  {state.language === "fa" ? "فارسی" : "English"}
                  <ChevronDown />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="bottom">
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
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="flex flex-1 flex-col">{children}</main>

      {/* Footer - visible on all pages */}
      <footer className="border-border bg-muted/30 border-t px-4 py-4 pt-8">
        {/* Links below the card */}
        <div className="mb-4 flex flex-row justify-center gap-5 sm:mb-6 sm:gap-7">
          <Link
            href={routes.home}
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm transition-colors"
          >
            <House className="h-4 w-4" />
            خانه
          </Link>
          <Link
            href={routes.security}
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm transition-colors"
          >
            <Shield className="h-4 w-4" />
            نگرانی‌های امنیتی
          </Link>
          <Link
            href={routes.about}
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm transition-colors"
          >
            <HelpCircle className="h-4 w-4" />
            ما چه کاری انجام می‌دهیم؟
          </Link>
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
