"use client";

import { useApp } from "@/context/app-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

export function ReportSuccessScreen() {
  const { navigate } = useApp();

  const handleBackToMenu = () => {
    console.log("[v0] Navigating back to main menu");
    navigate("main-menu");
  };

  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <CardTitle className="text-foreground text-xl font-bold">
            گزارش شما با موفقیت ثبت شد
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-secondary rounded-lg p-4 text-center">
            <p className="text-muted-foreground">
              از همکاری شما سپاسگزاریم. گزارش شما توسط تیم ما بررسی خواهد شد و نتیجه از طریق بخش
              «درخواست‌های من» قابل پیگیری است.
            </p>
          </div>

          <div className="bg-primary/5 border-primary/20 rounded-lg border p-4 text-center">
            <p className="text-primary text-sm font-medium">یک توکن به حساب شما اضافه شد!</p>
          </div>

          <Button onClick={handleBackToMenu} className="w-full">
            بازگشت به منوی اصلی
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
