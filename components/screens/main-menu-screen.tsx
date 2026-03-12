"use client";

import { useRouter } from "next/navigation";
import { useApp } from "@/context/app-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Coins, FileText, ListChecks, ClipboardCheck, LogOut, UserPlus } from "lucide-react";
import { routes } from "@/lib/routes";

export function MainMenuScreen() {
  const router = useRouter();
  const { state, startReport } = useApp();
  const user = state.user;

  // Show approval section only for users with 5+ approved requests
  const showApprovalSection = user && user.approvedRequestsCount >= 5;

  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-foreground text-2xl font-bold">منوی اصلی</CardTitle>
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
