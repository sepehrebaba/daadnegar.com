"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { getAppBaseUrl } from "@/lib/app-base-url";
import { getInviteToken } from "@/lib/edyen";

/** Uses fetch instead of Eden `api.admin` so this file type-checks when `App` is the web-only bundle (Docker `build-web`). */
export function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (pathname === "/admin/login") {
      setReady(true);
      return;
    }

    const check = async () => {
      const token = getInviteToken();
      const headers = new Headers();
      if (token) headers.set("Authorization", `Bearer ${token}`);
      const res = await fetch(`${getAppBaseUrl()}/api/admin/me`, {
        credentials: "include",
        headers,
      });
      if (!res.ok) {
        router.replace("/admin/login");
        return;
      }
      setReady(true);
    };
    check();
  }, [pathname, router]);

  if (pathname === "/admin/login") return <>{children}</>;
  if (!ready)
    return (
      <div className="flex min-h-screen items-center justify-center p-6">{t("common.loading")}</div>
    );
  return <>{children}</>;
}
