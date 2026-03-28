"use client";

import Link from "next/link";
import Image from "next/image";
import { useApp } from "@/context/app-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { KeyRound, LogIn, UserCircle, ShieldCheck, FileText, ArrowLeft } from "lucide-react";
import { routes } from "@/lib/routes";

export function WelcomeScreen() {
  const { state } = useApp();
  const user = state.user;

  return (
    <div className="w-full">
      <section className="bg-background mx-auto grid w-full max-w-[1600px] grid-cols-1 gap-6 px-4 py-8 md:px-6 md:py-10 lg:grid-cols-2 lg:gap-10 lg:px-8">
        <div className="order-2 flex flex-col justify-center lg:order-1">
          <h1 className="text-foreground text-3xl font-black md:text-4xl lg:text-5xl">
            به دادنگار خوش آمدید
          </h1>
          <p className="text-muted-foreground mt-4 max-w-2xl leading-8">
            دادنگار یک سرویس آزاد و ناشناس برای ثبت و پیگیری گزارش‌هاست. می‌توانید گزارش خود را ثبت
            کنید، روند بررسی را دنبال کنید و گزارش‌های عمومی تاییدشده را ببینید.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            {user ? (
              <Button asChild className="justify-center gap-3 py-6 text-base">
                <Link href={routes.mainMenu}>
                  <UserCircle className="h-5 w-5 shrink-0" />
                  ورود به پنل کاربری
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild className="justify-center gap-3 py-6 text-sm">
                  <Link href={routes.inviteCode}>
                    <KeyRound className="h-5 w-5 shrink-0" />
                    شروع با کد دعوت
                  </Link>
                </Button>
                <Button asChild variant="secondary" className="justify-center gap-3 py-6 text-sm">
                  <Link href={routes.login}>
                    <LogIn className="h-5 w-5 shrink-0" />
                    ورود و ثبت گزارش
                  </Link>
                </Button>
              </>
            )}
          </div>

          <div className="mt-3">
            <Button asChild variant="outline" className="gap-2">
              <Link href={routes.publicReports}>
                <FileText className="h-4 w-4" />
                مشاهده گزارش‌های عمومی
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="order-1 lg:order-2">
          <Card className="overflow-hidden">
            <CardHeader className="text-center">
              <CardTitle className="text-xl font-bold md:text-2xl">گزارش امن و بی‌واسطه</CardTitle>
              <CardDescription>بدون نیاز به اطلاعات هویتی</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center">
              <Image
                src="/hero.png"
                alt="دادنگار"
                width={640}
                height={420}
                priority
                className="h-auto w-full max-w-xl object-contain"
              />
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1600px] px-4 pb-8 md:px-6 lg:px-8 lg:pb-10">
        <Alert className="border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/50">
          <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-500" />
          <AlertDescription className="leading-7 text-emerald-800 dark:text-emerald-200">
            <span className="font-semibold">حریم خصوصی و امنیت شما:</span> ما هیچ داده‌ای از شما
            ذخیره نمی‌کنیم. آدرس IP و اطلاعات شناسایی شما ثبت نمی‌شود و متادیتای فایل‌های آپلودشده پیش
            از ذخیره حذف خواهد شد. برای امنیت بیشتر، استفاده از مرورگر Tor توصیه می‌شود.
          </AlertDescription>
        </Alert>
      </section>
    </div>
  );
}
