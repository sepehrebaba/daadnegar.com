"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/user-context";
import { routes } from "@/lib/routes";

export function ReportSearchValidatorGate({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const router = useRouter();
  const allowed = user?.role === "validator";

  useEffect(() => {
    if (user && !allowed) router.replace(routes.mainMenu);
  }, [user, allowed, router]);

  if (!user) {
    return (
      <div className="text-muted-foreground flex min-h-[40vh] items-center justify-center p-4 text-sm">
        در حال بارگذاری...
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="text-muted-foreground flex min-h-[40vh] items-center justify-center p-4 text-sm">
        در حال هدایت...
      </div>
    );
  }

  return children;
}
