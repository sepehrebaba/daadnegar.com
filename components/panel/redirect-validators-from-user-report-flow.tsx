"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/app-context";
import { routes } from "@/lib/routes";

/** Validators should not see the report wizard or “my requests”. */
export function RedirectValidatorsFromUserReportFlow({ children }: { children: React.ReactNode }) {
  const { state } = useApp();
  const router = useRouter();
  const block = state.user?.role === "validator";

  useEffect(() => {
    if (block) router.replace(routes.mainMenu);
  }, [block, router]);

  if (block) {
    return (
      <div className="text-muted-foreground flex min-h-[40vh] items-center justify-center p-4 text-sm">
        در حال هدایت...
      </div>
    );
  }
  return children;
}
