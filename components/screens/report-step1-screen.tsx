"use client";

import { useRouter } from "next/navigation";
import { useApp } from "@/context/app-context";
import { routes } from "@/lib/routes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { User, Users } from "lucide-react";

export function ReportStep1Screen() {
  const router = useRouter();
  const { startReport } = useApp();

  const handleFamousPerson = () => {
    console.log("[v0] User selected: Famous person");
    startReport();
    router.push(routes.reportFamous);
  };

  const handleManualEntry = () => {
    console.log("[v0] User selected: Manual entry");
    startReport();
    router.push(routes.reportManual);
  };

  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-foreground text-xl font-bold">
            مرحله ۱: انتخاب نوع فرد
          </CardTitle>
          <CardDescription>آیا گزارش شما درباره یک فرد معروف است؟</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Button
            onClick={handleFamousPerson}
            className="h-auto w-full flex-col gap-2 py-8 text-base"
            variant="outline"
          >
            <Users className="h-8 w-8" />
            <span>بله، فرد معروف است</span>
            <span className="text-muted-foreground text-xs">انتخاب از لیست افراد</span>
          </Button>

          <Button
            onClick={handleManualEntry}
            className="h-auto w-full flex-col gap-2 py-8 text-base"
            variant="outline"
          >
            <User className="h-8 w-8" />
            <span>خیر، وارد کردن دستی</span>
            <span className="text-muted-foreground text-xs">ورود اطلاعات فرد</span>
          </Button>

          <Button onClick={() => router.back()} variant="ghost" className="mt-2">
            بازگشت
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
