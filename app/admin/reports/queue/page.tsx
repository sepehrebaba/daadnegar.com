"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/edyen";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, ChevronRight } from "lucide-react";

type QueueReport = {
  id: string;
  description: string;
  createdAt: string;
  person: { firstName: string; lastName: string };
  user: { name: string; email: string };
  reviews: { action: string; createdAt: string; reviewerId?: string | null }[];
  acceptedCount?: number;
  rejectedCount?: number;
};

function ReviewProgressBar({
  accepted,
  rejected,
  total,
}: {
  accepted: number;
  rejected: number;
  total: number;
}) {
  const rest = Math.max(0, total - accepted - rejected);
  const totalSegments = total || 1;
  const acceptedPct = (accepted / totalSegments) * 100;
  const rejectedPct = (rejected / totalSegments) * 100;
  const restPct = (rest / totalSegments) * 100;

  return (
    <div className="flex h-2 w-full min-w-[120px] overflow-hidden rounded-full">
      {acceptedPct > 0 && (
        <div className="bg-green-500 transition-all" style={{ width: `${acceptedPct}%` }} />
      )}
      {rejectedPct > 0 && (
        <div className="bg-red-500 transition-all" style={{ width: `${rejectedPct}%` }} />
      )}
      {restPct > 0 && <div className="bg-muted transition-all" style={{ width: `${restPct}%` }} />}
    </div>
  );
}

function TimelineItem({
  label,
  date,
  active,
}: {
  label: string;
  date?: string | null;
  active?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <div
        className={`mt-1.5 h-3 w-3 shrink-0 rounded-full ${active ? "bg-primary" : "bg-muted"}`}
      />
      <div>
        <p className={`font-medium ${active ? "text-foreground" : "text-muted-foreground"}`}>
          {label}
        </p>
        {date && (
          <p className="text-muted-foreground text-xs">
            {new Date(date).toLocaleDateString("fa-IR", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        )}
      </div>
    </div>
  );
}

export default function AdminReportsQueuePage() {
  const [reports, setReports] = useState<QueueReport[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [minApproved, setMinApproved] = useState(5);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<QueueReport | null>(null);
  const [reportDetail, setReportDetail] = useState<{
    id: string;
    createdAt: string;
    reviewedAt?: string | null;
    reviews: { action: string; createdAt: string }[];
  } | null>(null);

  const fetchQueue = async () => {
    setLoading(true);
    const base = typeof window !== "undefined" ? window.location.origin : "";
    const queueRes = await fetch(`${base}/api/admin/reports/queue?page=${page}&perPage=25`, {
      credentials: "include",
    });
    const queueData = await queueRes.json();
    setReports(queueData?.data ?? []);
    setTotal(queueData?.total ?? 0);
    setMinApproved(queueData?.minApproved ?? 5);
    setLoading(false);
  };

  useEffect(() => {
    fetchQueue();
  }, [page]);

  const openDetails = async (r: QueueReport) => {
    setSelectedReport(r);
    setDetailsOpen(true);
    const { data } = await api.admin.reports({ id: r.id }).get();
    setReportDetail(
      data
        ? {
            id: (data as { id: string }).id,
            createdAt: (data as { createdAt: string }).createdAt,
            reviewedAt: (data as { reviewedAt?: string | null }).reviewedAt,
            reviews: ((data as { reviews?: { action: string; createdAt: string }[] }).reviews ??
              []) as { action: string; createdAt: string }[],
          }
        : null,
    );
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/reports">
              <ChevronRight className="ml-1 h-4 w-4" />
              بازگشت
            </Link>
          </Button>
        </div>
        <h1 className="text-2xl font-bold">صف بررسی گزارشات</h1>
      </div>

      {loading ? (
        <p>در حال بارگذاری...</p>
      ) : reports.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">گزارشی در انتظار بررسی نیست.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>وضعیت بررسی توسط اعتبارسنج‌ها</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>شخص</TableHead>
                  <TableHead>کاربر</TableHead>
                  <TableHead>تاریخ ثبت</TableHead>
                  <TableHead>تایید / رد / در انتظار</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      {r.person.firstName} {r.person.lastName}
                    </TableCell>
                    <TableCell>
                      {r.user.name}
                      <span className="text-muted-foreground text-sm"> ({r.user.email})</span>
                    </TableCell>
                    <TableCell>{new Date(r.createdAt).toLocaleDateString("fa-IR")}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <ReviewProgressBar
                          accepted={r.acceptedCount ?? 0}
                          rejected={r.rejectedCount ?? 0}
                          total={minApproved}
                        />
                        <span className="text-muted-foreground text-xs">
                          تایید: {r.acceptedCount ?? 0} | رد: {r.rejectedCount ?? 0} | در انتظار:{" "}
                          {minApproved - (r.acceptedCount ?? 0) - (r.rejectedCount ?? 0)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => openDetails(r)}>
                        <Eye className="ml-1 h-4 w-4" />
                        جزئیات
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="mt-4 flex justify-between">
              <span>
                صفحه {page} از {Math.ceil(total / 25) || 1}
              </span>
              <div className="flex gap-2">
                <Button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  قبلی
                </Button>
                <Button disabled={page * 25 >= total} onClick={() => setPage((p) => p + 1)}>
                  بعدی
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تایم‌لاین گزارش</DialogTitle>
          </DialogHeader>
          {selectedReport && reportDetail && (
            <div className="space-y-4 py-4">
              <p className="font-medium">
                {selectedReport.person.firstName} {selectedReport.person.lastName}
              </p>
              <div className="space-y-4">
                <TimelineItem label="ثبت" date={reportDetail.createdAt} active />
                <TimelineItem
                  label="اساین به اعتبارسنج"
                  date={
                    reportDetail.reviews.length > 0
                      ? (
                          reportDetail.reviews[reportDetail.reviews.length - 1] as {
                            createdAt: string;
                          }
                        )?.createdAt
                      : undefined
                  }
                  active={reportDetail.reviews.length > 0}
                />
                <TimelineItem
                  label="در حال بررسی"
                  date={
                    reportDetail.reviews.length > 0 ? reportDetail.reviews[0]?.createdAt : undefined
                  }
                  active={reportDetail.reviews.length > 0}
                />
                <TimelineItem
                  label="بررسی"
                  date={
                    reportDetail.reviewedAt ??
                    (reportDetail.reviews.length > 0
                      ? reportDetail.reviews[0]?.createdAt
                      : undefined)
                  }
                  active={!!reportDetail.reviewedAt || reportDetail.reviews.length > 0}
                />
              </div>
              {reportDetail.reviews.length > 0 && (
                <div className="border-border mt-4 rounded-lg border p-3">
                  <p className="mb-2 text-sm font-medium">بررسی‌های انجام شده</p>
                  <div className="space-y-1 text-sm">
                    {reportDetail.reviews.map((rev, i) => (
                      <div key={i} className="text-muted-foreground flex justify-between">
                        <span>{rev.action === "accepted" ? "تایید" : "رد"}</span>
                        <span>
                          {new Date(rev.createdAt).toLocaleDateString("fa-IR", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <Button asChild className="mt-4 w-full">
                <Link href={`/admin/reports/${selectedReport.id}`}>مشاهده کامل گزارش</Link>
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
