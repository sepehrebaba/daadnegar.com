"use client";

import { useEffect } from "react";
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
} from "lucide-react";
import { routes } from "@/lib/routes";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { api } from "@/lib/edyen";

export function MainMenuScreen() {
  const router = useRouter();
  const { state, startReport, setUser } = useApp();
  const user = state.user;

  // بارگذاری کاربر از سرور در صورت رفرش یا ورود مستقیم (invite token یا session cookie)
  useEffect(() => {
    if (state.user) return;
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
      } as Parameters<typeof setUser>[0]);
    });
    return () => {
      cancelled = true;
    };
  }, [state.user, setUser]);

  // Show approval section only for users with 5+ approved requests
  const showApprovalSection = user && user.approvedRequestsCount >= 5;

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
          <CardTitle className="text-foreground text-2xl font-bold">پنل کاربری</CardTitle>
          <p className="text-muted-foreground mt-2">به دادبان خوش آمدید</p>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button
            onClick={() => router.push(routes.myTokens)}
            className="w-full justify-start gap-3 py-6 text-base"
            variant="outline"
          >
            <Coins className="h-5 w-5" />
            توکن‌های من
            <span className="bg-primary/10 text-primary mr-auto rounded-full px-2 py-1 text-sm">
              {user?.tokensCount || 0}
            </span>
          </Button>

          <Button
            onClick={() => {
              startReport();
              router.push(routes.reportCategory);
            }}
            className="w-full justify-start gap-3 py-6 text-base"
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
            درخواست‌های من
          </Button>

          <Button
            onClick={() => router.push(routes.inviteUser)}
            className="w-full justify-start gap-3 py-6 text-base"
            variant="outline"
          >
            <UserPlus className="h-5 w-5" />
            دعوت کاربر
          </Button>

          {showApprovalSection && (
            <Button
              onClick={() => router.push(routes.approvalList)}
              className="w-full justify-start gap-3 border-amber-300 bg-amber-100 py-6 text-base text-amber-900 hover:bg-amber-200"
              variant="outline"
            >
              <ClipboardCheck className="h-5 w-5" />
              لیست انتظار تایید
            </Button>
          )}

          <div className="border-border my-2 border-t" />

          <Button
            onClick={() => router.push(routes.home)}
            variant="ghost"
            className="text-muted-foreground w-full gap-2"
          >
            <LogOut className="h-4 w-4" />
            خروج
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
