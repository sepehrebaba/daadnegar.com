"use client";

import { useApp } from "@/context/app-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info } from "lucide-react";

export function AboutScreen() {
  const { goBack } = useApp();

  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
            <Info className="text-primary h-8 w-8" />
          </div>
          <CardTitle className="text-foreground text-xl font-bold">درباره نجوا</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-justify leading-relaxed">
            نجوا یک پلتفرم امن برای گزارش‌دهی است. ما به شما کمک می‌کنیم تا بتوانید به صورت ناشناس و
            امن، گزارش‌های خود را ثبت کنید.
          </p>
          <p className="text-muted-foreground text-justify leading-relaxed">
            هدف ما ایجاد شفافیت و کمک به اجرای عدالت است. تمام اطلاعات شما با بالاترین سطح امنیت
            محافظت می‌شود.
          </p>
          <Button onClick={goBack} variant="outline" className="mt-6 w-full">
            بازگشت
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
