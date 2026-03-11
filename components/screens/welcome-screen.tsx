"use client";

import { useApp } from "@/context/app-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Shield, HelpCircle, KeyRound, LogIn } from "lucide-react";
import Image from "next/image";

export function WelcomeScreen() {
  const { navigate } = useApp();

  return (
    <div className="flex flex-1 flex-col items-center p-4 pb-3">
      {/* Main card */}
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-foreground text-2xl font-bold">به دادبان خوش آمدید</CardTitle>
          <CardDescription className="mt-2 text-base">
            ما اینجا هستیم تا مطمئن شویم هیچ‌کس از عدالت فرار نمی‌کند
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <img src="./hero.png" alt="دادبان" className="h-auto w-full object-contain" />

          <p className="text-muted-foreground mt-2 text-center text-sm font-medium">
            برای شروع، لطفاً یکی از روش‌های زیر را انتخاب کنید
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              onClick={() => navigate("invite-code")}
              className="flex-1 justify-center gap-3 py-6 text-base"
              variant="default"
            >
              <KeyRound className="h-5 w-5 shrink-0" />
              کد دعوت
            </Button>
            <Button
              onClick={() => navigate("login")}
              className="flex-1 justify-center gap-3 py-6 text-base"
              variant="secondary"
            >
              <LogIn className="h-5 w-5 shrink-0" />
              ورود با ایمیل
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
