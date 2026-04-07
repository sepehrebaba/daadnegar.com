"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  FolderTree,
  Users,
  UserCircle,
  FileText,
  ScrollText,
  Shield,
  LogOut,
  ChevronDown,
  UserCog,
  MapPin,
  Settings,
  UserRound,
  SlidersHorizontal,
} from "lucide-react";
import { AdminAuthGuard } from "@/components/admin-auth-guard";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

function LogoutButton() {
  const router = useRouter();
  const { t } = useTranslation();
  const handleLogout = async () => {
    await fetch("/api/admin-panel/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    router.replace("/admin/login");
  };
  return (
    <Button
      type="button"
      variant="ghost"
      className="mt-4 w-full justify-start gap-3"
      onClick={handleLogout}
    >
      <LogOut className="h-5 w-5" />
      {t("admin.logout")}
    </Button>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { t } = useTranslation();
  const [pendingCount, setPendingCount] = useState(0);

  const navItems = [
    { href: "/admin/reports", label: t("admin.nav.reports"), icon: FileText },
    { href: "/admin/users", label: t("admin.nav.users"), icon: Users },
    { href: "/admin/logs", label: t("admin.nav.logs"), icon: ScrollText },
  ];

  const reportSettingsSubItems = [
    { href: "/admin/categories", label: t("admin.nav.categories"), icon: FolderTree },
    { href: "/admin/people", label: t("admin.nav.people"), icon: UserCircle },
    { href: "/admin/provinces", label: t("admin.nav.provinces"), icon: MapPin },
  ];

  const settingsSubItems = [
    { href: "/admin/settings", label: t("admin.nav.systemSettings"), icon: Settings },
    { href: "/admin/settings/user", label: t("admin.nav.userSettings"), icon: UserRound },
    { href: "/admin/settings/panel-users", label: t("admin.nav.panelUsers"), icon: UserCog },
  ];

  const isReportSettingsActive = reportSettingsSubItems.some((item) => pathname === item.href);
  const isSettingsActive = settingsSubItems.some((s) => pathname === s.href);

  useEffect(() => {
    if (pathname === "/admin/login") return;
    const base = typeof window !== "undefined" ? window.location.origin : "";
    fetch(`${base}/api/admin/reports/pending-count`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setPendingCount(d?.count ?? 0))
      .catch(() => {});
  }, [pathname]);

  return (
    <AdminAuthGuard>
      <div className="flex min-h-screen" dir="rtl">
        {pathname !== "/admin/login" && (
          <aside className="border-border bg-muted/70 flex w-64 min-w-64 shrink-0 flex-col gap-2 border-s p-4">
            <div className="mb-4 flex items-center justify-between gap-2 px-2">
              <h2 className="text-lg font-bold">{t("admin.panel")}</h2>
              <ThemeToggle />
            </div>
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-4 py-2",
                  pathname === href ||
                    (href === "/admin/reports" && pathname?.startsWith("/admin/reports"))
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted",
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {label}
                {href === "/admin/reports" && pendingCount > 0 && (
                  <Badge variant="destructive" className="me-1 min-w-5 px-1.5 py-0 text-[10px]">
                    {pendingCount}
                  </Badge>
                )}
              </Link>
            ))}
            <Collapsible defaultOpen={isReportSettingsActive} className="group/collapsible">
              <CollapsibleTrigger
                className={cn(
                  "hover:bg-muted flex w-full items-center justify-between gap-3 rounded-lg px-4 py-2",
                  isReportSettingsActive && "bg-muted",
                )}
              >
                <span className="flex items-center gap-3">
                  <SlidersHorizontal className="h-5 w-5 shrink-0" />
                  {t("admin.nav.reportForm")}
                </span>
                <ChevronDown className="h-4 w-4 shrink-0 transition-transform group-data-[state=open]/collapsible:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-1 flex flex-col gap-0.5 pr-6">
                  {reportSettingsSubItems.map(({ href, label, icon: Icon }) => (
                    <Link
                      key={href}
                      href={href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm",
                        pathname === href ? "bg-primary text-primary-foreground" : "hover:bg-muted",
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {label}
                    </Link>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
            <Collapsible defaultOpen={isSettingsActive} className="group/collapsible">
              <CollapsibleTrigger
                className={cn(
                  "hover:bg-muted flex w-full items-center justify-between gap-3 rounded-lg px-4 py-2",
                  isSettingsActive && "bg-muted",
                )}
              >
                <span className="flex items-center gap-3">
                  <Shield className="h-5 w-5 shrink-0" />
                  {t("admin.nav.settings")}
                </span>
                <ChevronDown className="h-4 w-4 shrink-0 transition-transform group-data-[state=open]/collapsible:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-1 flex flex-col gap-0.5 pr-6">
                  {settingsSubItems.map(({ href, label, icon: Icon }) => (
                    <Link
                      key={href}
                      href={href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm",
                        pathname === href ? "bg-primary text-primary-foreground" : "hover:bg-muted",
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {label}
                    </Link>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
            <LogoutButton />
          </aside>
        )}
        <main className="min-w-0 flex-1 p-6">{children}</main>
      </div>
    </AdminAuthGuard>
  );
}
