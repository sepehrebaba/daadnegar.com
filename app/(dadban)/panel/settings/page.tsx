"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { routes } from "@/lib/routes";

/** ریدایرکت به پنل با باز شدن مودال تنظیمات */
export default function SettingsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(`${routes.mainMenu}?settings=open`);
  }, [router]);

  return (
    <div className="bg-background flex min-h-[200px] items-center justify-center">
      <p className="text-muted-foreground">در حال بارگذاری...</p>
    </div>
  );
}
