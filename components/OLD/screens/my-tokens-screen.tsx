"use client";

import { useApp } from "@/context/app-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Coins } from "lucide-react";

export function MyTokensScreen() {
  const { state, goBack } = useApp();
  const user = state.user;

  console.log("[v0] Displaying user tokens count:", user?.tokensCount);

  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="bg-primary/10 mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full">
            <Coins className="text-primary h-10 w-10" />
          </div>
          <CardTitle className="text-foreground text-xl font-bold">توکن‌های من</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="text-primary mb-2 text-6xl font-bold">{user?.tokensCount || 0}</div>
            <p className="text-muted-foreground">توکن فعال</p>
          </div>

          <div className="bg-secondary rounded-lg p-4 text-center">
            <p className="text-muted-foreground text-sm">
              با هر گزارش تایید شده، توکن دریافت می‌کنید. توکن‌ها امتیاز شما در سیستم را نشان می‌دهند.
            </p>
          </div>

          <Button onClick={goBack} variant="outline" className="w-full">
            بازگشت
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
