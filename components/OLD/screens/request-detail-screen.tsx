"use client";

import { useApp } from "@/context/app-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, CheckCircle, XCircle, User, FileText, Calendar } from "lucide-react";
import type { RequestStatus } from "@/types";

const statusConfig: Record<
  RequestStatus,
  { label: string; icon: typeof Clock; color: string; bgColor: string }
> = {
  pending: {
    label: "در انتظار بررسی",
    icon: Clock,
    color: "text-amber-600",
    bgColor: "bg-amber-100",
  },
  accepted: {
    label: "تایید شده",
    icon: CheckCircle,
    color: "text-green-600",
    bgColor: "bg-green-100",
  },
  rejected: { label: "رد شده", icon: XCircle, color: "text-red-600", bgColor: "bg-red-100" },
};

export function RequestDetailScreen() {
  const { state, goBack } = useApp();
  const request = state.selectedRequest;

  if (!request) {
    console.log("[v0] No request selected, redirecting back");
    goBack();
    return null;
  }

  const status = statusConfig[request.status];
  const StatusIcon = status.icon;

  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-foreground text-xl font-bold">جزئیات درخواست</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* وضعیت */}
          <div
            className={`flex items-center justify-center gap-2 rounded-lg p-4 ${status.bgColor}`}
          >
            <StatusIcon className={`h-6 w-6 ${status.color}`} />
            <span className={`font-medium ${status.color}`}>{status.label}</span>
          </div>

          {/* اطلاعات فرد */}
          <div className="bg-secondary space-y-3 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full">
                <User className="text-primary h-6 w-6" />
              </div>
              <div>
                <div className="text-foreground font-medium">
                  {request.person.firstName} {request.person.lastName}
                </div>
                <div className="text-muted-foreground text-sm">
                  {request.person.isFamous ? "فرد معروف" : "ثبت دستی"}
                </div>
              </div>
            </div>
          </div>

          {/* تاریخ ثبت */}
          <div className="bg-muted flex items-center gap-3 rounded-lg p-3">
            <Calendar className="text-muted-foreground h-5 w-5" />
            <div className="text-sm">
              <span className="text-muted-foreground">تاریخ ثبت: </span>
              <span className="text-foreground">
                {new Date(request.createdAt).toLocaleDateString("fa-IR")}
              </span>
            </div>
          </div>

          {/* تعداد اسناد */}
          <div className="bg-muted flex items-center gap-3 rounded-lg p-3">
            <FileText className="text-muted-foreground h-5 w-5" />
            <div className="text-sm">
              <span className="text-muted-foreground">تعداد اسناد: </span>
              <span className="text-foreground">{request.documents.length} فایل</span>
            </div>
          </div>

          {/* توضیحات */}
          <div className="border-border rounded-lg border p-4">
            <h3 className="text-foreground mb-2 text-sm font-medium">شرح گزارش:</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">{request.description}</p>
          </div>

          <Button onClick={goBack} variant="outline" className="w-full">
            بازگشت
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
