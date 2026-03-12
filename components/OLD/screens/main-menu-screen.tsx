"use client";

import { useApp } from "@/context/app-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Coins, FileText, ListChecks, ClipboardCheck, LogOut } from "lucide-react";

export function MainMenuScreen() {
  const { navigate, state, goBack } = useApp();
  const user = state.user;

  // نمایش بخش تایید فقط برای کاربرانی که ۵ درخواست تایید شده دارند
  const showApprovalSection = user && user.approvedRequestsCount >= 5;

  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-foreground text-2xl font-bold">منوی اصلی</CardTitle>
          <p className="text-muted-foreground mt-2">به نجوا خوش آمدید</p>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button
            onClick={() => {
              console.log("[v0] User clicked: My Tokens");
              navigate("my-tokens");
            }}
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
              console.log("[v0] User clicked: Report Case");
              navigate("report-category");
            }}
            className="w-full justify-start gap-3 py-6 text-base"
            variant="default"
          >
            <FileText className="h-5 w-5" />
            ثبت گزارش جدید
          </Button>

          <Button
            onClick={() => {
              console.log("[v0] User clicked: My Requests");
              navigate("my-requests");
            }}
            className="w-full justify-start gap-3 py-6 text-base"
            variant="outline"
          >
            <ListChecks className="h-5 w-5" />
            درخواست‌های من
          </Button>

          {showApprovalSection && (
            <Button
              onClick={() => {
                console.log("[v0] User clicked: Approval Wait List");
                navigate("approval-list");
              }}
              className="w-full justify-start gap-3 border-amber-300 bg-amber-100 py-6 text-base text-amber-900 hover:bg-amber-200"
              variant="outline"
            >
              <ClipboardCheck className="h-5 w-5" />
              لیست انتظار تایید
            </Button>
          )}

          <div className="border-border my-2 border-t" />

          <Button
            onClick={() => {
              console.log("[v0] User logging out");
              goBack();
            }}
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
