"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/app-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Search,
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
  const [pendingReviewCount, setPendingReviewCount] = useState<number | null>(null);

  // Load user from server and settings (refresh, direct login, or update)
  useEffect(() => {
    let cancelled = false;
    api.me.get().then((result: Awaited<ReturnType<typeof api.me.get>>) => {
      const { data, error } = result;
      if (cancelled || error || !data) return;
      setUser({
        id: data.id,
        passkey: "",
        inviteCode: data.inviteCode ?? "",
        isActivated: true,
        tokensCount: data.tokensCount ?? 0,
        approvedRequestsCount: data.approvedRequestsCount ?? 0,
        role: data.role ?? "user",
        username: (data as { username?: string }).username,
        name: data.name,
        mustChangePassword: (data as { mustChangePassword?: boolean }).mustChangePassword ?? false,
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

  // Show approval section for validators or users with enough approved reports
  const showApprovalSection =
    user != null &&
    (user.role === "validator" || user.approvedRequestsCount >= minApprovedForApproval);

  const isValidator = user?.role === "validator";

  useEffect(() => {
    if (!showApprovalSection) {
      setPendingReviewCount(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      const { data, error } = await api.reports.pending.count.get();
      if (cancelled) return;
      if (error || !data || typeof data.count !== "number") {
        setPendingReviewCount(0);
        return;
      }
      setPendingReviewCount(data.count);
    })();
    return () => {
      cancelled = true;
    };
  }, [showApprovalSection, user?.id, minApprovedForApproval]);

  return (
    <div className="bg-background flex flex-col items-center justify-center gap-4 p-4">
      {!isValidator && (
        <Alert className="max-w-md" variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            برای ثبت گزارش جدید، لطفاً مطمئن شوید که اتصال شما امن است.
          </AlertDescription>
        </Alert>
      )}
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-foreground text-2xl font-black">پنل کاربری</CardTitle>
          <p className="text-muted-foreground mt-2">به پلتفرم دادنگار خوش آمدید</p>
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

          {isValidator ? (
            <Button
              onClick={() => router.push(routes.reportSearch)}
              className="w-full justify-start gap-3 py-6 text-base font-black"
              variant="default"
            >
              <Search className="h-5 w-5" />
              جستجوی گزارشات
            </Button>
          ) : (
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
          )}

          {showApprovalSection && (
            <Button
              onClick={() => router.push(routes.approvalList)}
              className="w-full justify-start gap-3 border-amber-300 bg-amber-100 py-6 text-base font-black text-amber-900 hover:bg-amber-200 dark:border-amber-700 dark:bg-amber-900 dark:text-amber-100 dark:hover:bg-amber-800"
              variant="outline"
            >
              <ClipboardCheck className="h-5 w-5" />
              لیست انتظار بررسی
              <Badge
                variant="secondary"
                className="mr-auto h-5 min-w-5 rounded-full border-amber-400/60 bg-amber-200/90 px-1.5 text-[11px] font-bold text-amber-950 tabular-nums dark:border-amber-600 dark:bg-amber-800/90 dark:text-amber-50"
              >
                {pendingReviewCount === null ? "…" : toPersianNum(pendingReviewCount)}
              </Badge>
            </Button>
          )}
          {isValidator && (
            <Button
              onClick={() => router.push(`${routes.reportSearch}?reviewedByMe=1`)}
              className="w-full justify-start gap-3 py-6 text-base"
              variant="outline"
            >
              <ListChecks className="h-5 w-5" />
              گزارش‌های بررسی‌شده
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
