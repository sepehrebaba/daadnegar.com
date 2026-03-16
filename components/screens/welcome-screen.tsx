"use client";

import Link from "next/link";
import { useApp } from "@/context/app-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { KeyRound, LogIn, UserCircle } from "lucide-react";
import { routes } from "@/lib/routes";

export function WelcomeScreen() {
  const { state } = useApp();
  const user = state.user;

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

          {user ? (
            <>
              <p className="text-muted-foreground mt-2 text-center text-sm font-medium">
                به پنل کاربری خود وارد شوید
              </p>
              <Button
                asChild
                className="w-full justify-center gap-3 py-6 text-base"
                variant="default"
              >
                <Link href={routes.mainMenu}>
                  <UserCircle className="h-5 w-5 shrink-0" />
                  پنل کاربری
                </Link>
              </Button>
            </>
          ) : (
            <>
              <p className="text-muted-foreground mt-2 text-center text-sm font-medium">
                برای شروع، لطفاً یکی از روش‌های زیر را انتخاب کنید
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  asChild
                  className="flex-1 justify-center gap-3 py-6 text-base"
                  variant="default"
                >
                  <Link href={routes.inviteCode}>
                    <KeyRound className="h-5 w-5 shrink-0" />
                    کد دعوت
                  </Link>
                </Button>
                <Button
                  asChild
                  className="flex-1 justify-center gap-3 py-6 text-base"
                  variant="secondary"
                >
                  <Link href={routes.login}>
                    <LogIn className="h-5 w-5 shrink-0" />
                    ورود و ثبت گزارش
                  </Link>
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
