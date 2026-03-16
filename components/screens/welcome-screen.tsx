"use client";

import Link from "next/link";
import { useApp } from "@/context/app-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { KeyRound, LogIn, UserCircle, ShieldCheck } from "lucide-react";
import { routes } from "@/lib/routes";

export function WelcomeScreen() {
  const { state } = useApp();
  const user = state.user;

  return (
    <div className="flex flex-1 flex-col items-center p-4 pb-3">
      {/* Main card */}
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-foreground text-2xl font-black">به دادبان خوش آمدید</CardTitle>
          <CardDescription className="mt-2 text-xs">
            دادبان یک سرویس آزاد و ناشناس است که به شما امکان می‌دهد بدون نیاز به ورود و ثبت نام،
            گزارش‌های خود را ثبت کنید.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <img src="./hero.png" alt="دادبان" className="h-auto w-4/5 object-contain" />

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
              <Alert className="border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/50">
                <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-500" />
                <AlertDescription className="text-emerald-800 dark:text-emerald-200">
                  <span className="font-semibold">حریم خصوصی و امنیت شما:</span> ما هیچ داده‌ای از
                  شما ذخیره نمی‌کنیم. آدرس IP و اطلاعات شناسایی شما به هیچ عنوان ثبت نمی‌گردد، علاوه بر
                  آن ما متادیتای فایل‌های آپلود شده را قبل از ذخیره حذف می‌کنیم. در هر حال شدیدا توصیه
                  می‌شود از مرورگر tor استفاده کنید و توصیه‌های امنیتی را رعایت کنید.
                </AlertDescription>
              </Alert>
              <p className="text-muted-foreground mt-2 text-center text-sm font-medium">
                برای شروع، لطفاً یکی از روش‌های زیر را انتخاب کنید
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  asChild
                  className="flex-1 justify-center gap-3 py-6 text-sm"
                  variant="default"
                >
                  <Link href={routes.inviteCode}>
                    <KeyRound className="h-5 w-5 shrink-0" />
                    کد دعوت
                  </Link>
                </Button>
                <Button
                  asChild
                  className="flex-1 justify-center gap-3 py-6 text-sm"
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
