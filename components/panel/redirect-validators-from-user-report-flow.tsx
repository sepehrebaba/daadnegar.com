"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useUser } from "@/context/user-context";
import { routes } from "@/lib/routes";

/** Validators should not see the report wizard or "my requests". */
export function RedirectValidatorsFromUserReportFlow({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const { user } = useUser();
  const router = useRouter();
  const block = user?.role === "validator";

  useEffect(() => {
    if (block) router.replace(routes.mainMenu);
  }, [block, router]);

  if (block) {
    return (
      <div className="text-muted-foreground flex min-h-[40vh] items-center justify-center p-4 text-sm">
        {t("common.redirecting")}
      </div>
    );
  }
  return children;
}
