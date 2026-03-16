"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/app-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Coins,
  FileText,
  ListChecks,
  ClipboardCheck,
  LogOut,
  UserPlus,
  AlertCircle,
  Settings,
} from "lucide-react";
import { routes } from "@/lib/routes";
import { toPersianNum } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { api } from "@/lib/edyen";

export function MainMenuScreen() {
  const router = useRouter();
  const { state, startReport, setUser, logout } = useApp();
  const user = state.user;
  const [minApprovedForApproval, setMinApprovedForApproval] = useState(5);

  // بارگذاری کاربر از سرور و تنظیمات (رفرش، ورود مستقیم، یا به‌روزرسانی)
  useEffect(() => {
    let cancelled = false;
    api.me.get().then(({ data, error }) => {
      if (cancelled || error || !data) return;
      setUser({
        id: data.id,
        passkey: "",
        inviteCode: data.inviteCode ?? "",
        isActivated: true,
        tokensCount: data.tokensCount ?? 0,
        approvedRequestsCount: data.approvedRequestsCount ?? 0,
        role: data.role ?? "user",
      } as Parameters<typeof setUser>[0]);
      setMinApprovedForApproval(
        typeof data.minApprovedReportsForApproval === "number"
          ? data.minApprovedReportsForApproval
          : 5,
      );
    });
    return () => {
      cancelled = true;
    };
  }, [setUser]);

  // نمایش بخش تایید برای: کاربر validator یا کاربر با حداقل گزارش‌های تاییدشده
  const showApprovalSection =
    user && (user.role === "validator" || user.approvedRequestsCount >= minApprovedForApproval);

  return (
    <div className="bg-background flex flex-col items-center justify-center gap-4 p-4">
      <Alert className="max-w-md" variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          برای ثبت گزارش جدید، لطفاً مطمئن شوید که اتصال شما امن است.
        </AlertDescription>
      </Alert>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-foreground text-2xl font-black">پنل کاربری</CardTitle>
          <p className="text-muted-foreground mt-2">به پلتفرم دادبان خوش آمدید</p>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button
            onClick={() => router.push(routes.myTokens)}
            className="w-full justify-start gap-3 py-6 text-sm"
            variant="outline"
          >
            <Coins className="h-5 w-5" />
            توکن‌های من
            <span className="bg-primary/10 text-primary mr-auto rounded-full px-2 py-1 text-sm">
              {toPersianNum(user?.tokensCount ?? 0)}
            </span>
          </Button>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Button
              onClick={() => {
                startReport();
                router.push(routes.reportCategory);
              }}
              className="w-full justify-start gap-3 py-6 text-base font-black"
              variant="default"
            >
              <FileText className="h-5 w-5" />
              ثبت گزارش جدید
            </Button>
            <Button
              onClick={() => router.push(routes.myRequests)}
              className="w-full justify-start gap-3 py-6 text-base"
              variant="outline"
            >
              <ListChecks className="h-5 w-5" />
              گزارش‌های من
            </Button>
          </div>

          {showApprovalSection && (
            <Button
              onClick={() => router.push(routes.approvalList)}
              className="w-full justify-start gap-3 border-amber-300 bg-amber-100 py-6 text-base font-black text-amber-900 hover:bg-amber-200 dark:border-amber-700 dark:bg-amber-900 dark:text-amber-100 dark:hover:bg-amber-800"
              variant="outline"
            >
              <ClipboardCheck className="h-5 w-5" />
              لیست انتظار تایید
            </Button>
          )}

          <Button
            onClick={() => router.push(routes.inviteUser)}
            className="w-full justify-start gap-3 py-6 text-sm"
            variant="outline"
          >
            <UserPlus className="h-5 w-5" />
            دعوت کاربر
          </Button>

          <Button
            onClick={() => router.push(`${routes.mainMenu}?settings=open`)}
            className="w-full justify-start gap-3 py-6 text-sm"
            variant="outline"
          >
            <Settings className="h-5 w-5" />
            تنظیمات
          </Button>

          <div className="border-border my-2 border-t" />

          <Button onClick={logout} variant="ghost" className="text-muted-foreground w-full gap-2">
            <LogOut className="h-4 w-4" />
            خروج
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
