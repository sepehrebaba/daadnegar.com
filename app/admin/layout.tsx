"use client";

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
  Globe,
  UserCog,
  MapPin,
  Building2,
  Landmark,
  Settings,
} from "lucide-react";
import { AdminAuthGuard } from "@/components/admin-auth-guard";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

function LogoutButton() {
  const router = useRouter();
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
      خروج
    </Button>
  );
}

const navItems = [
  { href: "/admin/reports", label: "گزارش‌ها", icon: FileText },
  { href: "/admin/categories", label: "دسته‌بندی‌ها", icon: FolderTree },
  { href: "/admin/users", label: "کاربران", icon: Users },
  { href: "/admin/people", label: "افراد", icon: UserCircle },
  { href: "/admin/logs", label: "لاگ‌ها", icon: ScrollText },
];

const regionsSubItems = [
  { href: "/admin/provinces", label: "استان‌ها", icon: Landmark },
  { href: "/admin/cities", label: "شهرها", icon: Building2 },
];

const settingsSubItems = [
  { href: "/admin/settings", label: "تنظیمات سیستم", icon: Settings },
  { href: "/admin/settings/ip-whitelist", label: "IP های مجاز", icon: Globe },
  { href: "/admin/settings/panel-users", label: "کاربران پنل", icon: UserCog },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isRegionsActive = regionsSubItems.some((s) => pathname === s.href);
  const isSettingsActive = settingsSubItems.some((s) => pathname === s.href);

  return (
    <AdminAuthGuard>
      <div className="flex min-h-screen" dir="rtl">
        {pathname !== "/admin/login" && (
          <aside className="border-border bg-muted/70 flex w-64 flex-col gap-2 border-s p-4">
            <h2 className="mb-4 px-2 text-lg font-bold">پنل ادمین</h2>
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-4 py-2",
                  pathname === href ? "bg-primary text-primary-foreground" : "hover:bg-muted",
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {label}
              </Link>
            ))}
            <Collapsible defaultOpen={isRegionsActive} className="group/collapsible">
              <CollapsibleTrigger
                className={cn(
                  "hover:bg-muted flex w-full items-center justify-between gap-3 rounded-lg px-4 py-2",
                  isRegionsActive && "bg-muted",
                )}
              >
                <span className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 shrink-0" />
                  استان‌ها و شهرها
                </span>
                <ChevronDown className="h-4 w-4 shrink-0 transition-transform group-data-[state=open]/collapsible:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-1 flex flex-col gap-0.5 pr-6">
                  {regionsSubItems.map(({ href, label, icon: Icon }) => (
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
                  تنظیمات
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
        <main className="flex-1 p-6">{children}</main>
      </div>
    </AdminAuthGuard>
  );
}
