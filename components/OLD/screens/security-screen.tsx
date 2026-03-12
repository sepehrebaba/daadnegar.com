"use client";

import { useApp } from "@/context/app-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, EyeOff, Lock } from "lucide-react";

export function SecurityScreen() {
  const { goBack } = useApp();

  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="bg-accent/20 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
            <ShieldCheck className="text-accent-foreground h-8 w-8" />
          </div>
          <CardTitle className="text-foreground text-xl font-bold">سیاست‌های امنیتی</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-secondary flex items-start gap-4 rounded-lg p-4">
            <EyeOff className="text-primary mt-1 h-6 w-6 flex-shrink-0" />
            <div>
              <h3 className="text-foreground font-semibold">بدون ردیابی</h3>
              <p className="text-muted-foreground mt-1 text-sm">
                ما هیچ‌گونه اطلاعات شخصی مانند IP، هدرها یا اطلاعات دستگاه شما را جمع‌آوری نمی‌کنیم.
              </p>
            </div>
          </div>

          <div className="bg-secondary flex items-start gap-4 rounded-lg p-4">
            <Lock className="text-primary mt-1 h-6 w-6 flex-shrink-0" />
            <div>
              <h3 className="text-foreground font-semibold">رمزنگاری کامل</h3>
              <p className="text-muted-foreground mt-1 text-sm">
                تمام ارتباطات و داده‌های شما با الگوریتم‌های پیشرفته رمزنگاری می‌شوند.
              </p>
            </div>
          </div>

          <Button onClick={goBack} variant="outline" className="w-full">
            بازگشت
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
