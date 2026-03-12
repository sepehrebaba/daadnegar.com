"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { api } from "@/lib/edyen";
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
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string | undefined;
  const [request, setRequest] = useState<{
    id: string;
    person: { firstName: string; lastName: string; isFamous?: boolean };
    documents: { id?: string; name: string; url: string }[];
    description: string;
    status: RequestStatus;
    createdAt: Date | string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      router.back();
      return;
    }

    api
      .reports({ id })
      .get()
      .then(({ data, error: err }) => {
        if (err) {
          setError(err instanceof Error ? err.message : "خطا در بارگذاری");
          setLoading(false);
          return;
        }
        if (data) {
          setRequest(data as typeof request);
        } else {
          setError("درخواست یافت نشد");
        }
        setLoading(false);
      });
  }, [id, router]);

  if (!id) {
    return null;
  }

  if (loading) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">در حال بارگذاری...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="space-y-4 py-8">
            <p className="text-destructive text-center">{error || "درخواست یافت نشد"}</p>
            <Button onClick={() => router.back()} variant="outline" className="w-full">
              بازگشت
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const status = statusConfig[request.status as RequestStatus] ?? statusConfig.pending;
  const StatusIcon = status.icon;

  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-foreground text-xl font-bold">جزئیات درخواست</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status */}
          <div
            className={`flex items-center justify-center gap-2 rounded-lg p-4 ${status.bgColor}`}
          >
            <StatusIcon className={`h-6 w-6 ${status.color}`} />
            <span className={`font-medium ${status.color}`}>{status.label}</span>
          </div>

          {/* Person info */}
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

          {/* Registration date */}
          <div className="bg-muted flex items-center gap-3 rounded-lg p-3">
            <Calendar className="text-muted-foreground h-5 w-5" />
            <div className="text-sm">
              <span className="text-muted-foreground">تاریخ ثبت: </span>
              <span className="text-foreground">
                {new Date(request.createdAt).toLocaleDateString("fa-IR")}
              </span>
            </div>
          </div>

          {/* Document count */}
          <div className="bg-muted flex items-center gap-3 rounded-lg p-3">
            <FileText className="text-muted-foreground h-5 w-5" />
            <div className="text-sm">
              <span className="text-muted-foreground">تعداد اسناد: </span>
              <span className="text-foreground">{request.documents?.length ?? 0} فایل</span>
            </div>
          </div>

          {/* Description */}
          <div className="border-border rounded-lg border p-4">
            <h3 className="text-foreground mb-2 text-sm font-medium">شرح گزارش:</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">{request.description}</p>
          </div>

          <Button onClick={() => router.back()} variant="outline" className="w-full">
            بازگشت
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
