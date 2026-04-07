"use client";

import { useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useUser } from "@/context/user-context";
import { useLanguage } from "@/context/language-context";
import { SettingsModal } from "@/components/settings-modal";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import {
  Languages,
  House,
  UserCircle,
  Settings,
  Shield,
  HelpCircle,
  LogOut,
  FileText,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
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
import { api, DAADNEGAR_INVITE_TOKEN_KEY, setInviteTokenStorage } from "@/lib/edyen";
import { useTranslation } from "react-i18next";

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
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const appVersion = process.env.NEXT_PUBLIC_APP_VERSION;
  const { user, setUser, logout } = useUser();
  const { language, setLanguage } = useLanguage();
  const isSettingsOpen = searchParams.get("settings") === "open";
  const { t } = useTranslation();

  const closeSettings = () => {
    router.replace(pathname ?? "/");
  };

  // Show logout toast after redirect (full page load)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("daadnegar_logout_toast")) {
      sessionStorage.removeItem("daadnegar_logout_toast");
      toast(t("auth.logout.success"));
    }
  }, [t]);

  // Sync invite token from localStorage to cookie (for middleware) when token exists
  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem(DAADNEGAR_INVITE_TOKEN_KEY);
    if (token) setInviteTokenStorage(token);
  }, []);

  // Load user when auth exists (invite token or session cookie)
  useEffect(() => {
    if (user) return;
    const hasAuth =
      typeof window !== "undefined" &&
      (localStorage.getItem(DAADNEGAR_INVITE_TOKEN_KEY) || document.cookie.includes("better-auth"));
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
        role: data.role ?? "user",
        username: (data as { username?: string }).username,
        name: data.name,
        mustChangePassword: (data as { mustChangePassword?: boolean }).mustChangePassword ?? false,
      } as Parameters<typeof setUser>[0]);
    });

    return () => {
      cancelled = true;
    };
  }, [user, setUser]);

  useEffect(() => {
    if (!user?.mustChangePassword || !pathname) return;
    if (pathname.startsWith("/panel")) {
      router.replace(routes.changePasswordRequired);
    }
  }, [user?.mustChangePassword, pathname, router]);

  return (
    <div className="bg-background flex min-h-screen flex-col">
      {/* Header - visible on all pages */}
      <header className="border-border bg-background/95 supports-backdrop-filter:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur">
        <div className="container flex h-14 items-center justify-between px-4">
          <Link href={routes.home} className="flex items-center gap-2">
            <Image src="/logo.png" alt="Dadnegar" width={36} height={36} className="h-9 w-9" />
            <span className="text-foreground text-lg font-bold">{t("appName")}</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {user != null ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <UserCircle className="h-4 w-4" />
                    {t("nav.panel")}
                    <ChevronDown />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="bottom" align="end">
                  <DropdownMenuItem asChild>
                    <Link href={routes.mainMenu} className="flex items-center gap-2">
                      <UserCircle className="h-4 w-4" />
                      {t("nav.panel")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href={
                        pathname ? `${pathname}?settings=open` : routes.mainMenu + "?settings=open"
                      }
                      className="flex items-center gap-2"
                    >
                      <Settings className="h-4 w-4" />
                      {t("nav.settings")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => logout()}
                    className="gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    {t("nav.logout")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Languages className="h-4 w-4" />
                    {language === "fa" ? t("nav.persian") : t("nav.english")}
                    <ChevronDown />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="bottom">
                  <DropdownMenuCheckboxItem
                    checked={language === "fa"}
                    onCheckedChange={() => setLanguage("fa")}
                  >
                    {t("nav.persian")}
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={language === "en"}
                    onCheckedChange={() => setLanguage("en")}
                  >
                    English
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex flex-1 flex-col">{children}</main>

      {/* Settings modal */}
      {user && (
        <SettingsModal open={isSettingsOpen} onOpenChange={(open) => !open && closeSettings()} />
      )}

      {/* Footer - visible on all pages */}
      <footer className="border-border bg-muted/30 border-t px-4 py-4 pt-8">
        <div className="mb-4 flex flex-row justify-center gap-5 sm:mb-6 sm:gap-7">
          <Link
            href={routes.home}
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm transition-colors"
          >
            <House className="h-4 w-4" />
            {t("nav.home")}
          </Link>
          <Link
            href={routes.security}
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm transition-colors"
          >
            <Shield className="h-4 w-4" />
            {t("nav.security")}
          </Link>
          <Link
            href={routes.publicReports}
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm transition-colors"
          >
            <FileText className="h-4 w-4" />
            {t("nav.publicReports")}
          </Link>
          <Link
            href={routes.about}
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm transition-colors"
          >
            <HelpCircle className="h-4 w-4" />
            {t("nav.aboutUs")}
          </Link>
        </div>

        <div className="text-muted-foreground/70 container mx-auto mb-2 text-center text-xs">
          <p>{t("footer.copyright", { year: new Date().getFullYear() })}</p>
          {appVersion ? <p className="mt-1">Version: {appVersion}</p> : null}
        </div>
      </footer>
    </div>
  );
}
