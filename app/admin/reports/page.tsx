"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toPersianNum } from "@/lib/utils";
import { Eye } from "lucide-react";

type AssignmentRow = {
  assignedAt: string;
  acceptedAt?: string | null;
  reason: string;
  replacedAt?: string | null;
  validator: { id: string; name: string; username: string };
};

function activeSlots(list?: AssignmentRow[]) {
  return (list ?? []).filter((a) => a.replacedAt == null);
}

type QueueReport = {
  id: string;
  status: string;
  description: string;
  createdAt: string;
  assignedAt?: string | null;
  person: { firstName: string; lastName: string };
  user: { name: string; username: string };
  assignedToUser?: { id: string; name: string; username: string } | null;
  validatorAssignments?: AssignmentRow[];
  reviews: { action: string; createdAt: string; reviewerId?: string | null }[];
  acceptedCount?: number;
  rejectedCount?: number;
};

function reportStatusLabel(status: string): {
  label: string;
  variant: "default" | "secondary" | "destructive";
} {
  if (status === "accepted") return { label: "تأیید شده", variant: "default" };
  if (status === "rejected") return { label: "رد شده", variant: "destructive" };
  return { label: "در انتظار بررسی", variant: "secondary" };
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleDateString("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

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

export default function AdminReportsPage() {
  const [reports, setReports] = useState<QueueReport[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [minApproved, setMinApproved] = useState(5);

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

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">گزارش‌ها</h1>
      </div>

      {loading ? (
        <p>در حال بارگذاری...</p>
      ) : reports.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">گزارشی برای نمایش وجود ندارد.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle>گزارش‌ها</CardTitle>
            <p className="text-muted-foreground text-sm font-normal">
              در انتظار بررسی و تأییدشده (اکثریت رأی یا نهایی)
            </p>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>شخص</TableHead>
                  <TableHead>کاربر</TableHead>
                  <TableHead>تاریخ ثبت</TableHead>
                  <TableHead>وضعیت</TableHead>
                  <TableHead>اعتبارسنج‌های فعال</TableHead>
                  <TableHead>شروع اسلات فعلی</TableHead>
                  <TableHead>نصب رأی‌ها (تأیید / رد / در انتظار)</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((r) => {
                  const statusInfo = reportStatusLabel(r.status ?? "pending");
                  const waitingVotes = Math.max(
                    0,
                    minApproved - (r.acceptedCount ?? 0) - (r.rejectedCount ?? 0),
                  );
                  return (
                    <TableRow key={r.id}>
                      <TableCell>
                        {r.person.firstName} {r.person.lastName}
                      </TableCell>
                      <TableCell>
                        {r.user.name}
                        <span className="text-muted-foreground text-sm"> ({r.user.username})</span>
                      </TableCell>
                      <TableCell>{new Date(r.createdAt).toLocaleDateString("fa-IR")}</TableCell>
                      <TableCell>
                        <Badge variant={statusInfo.variant} className="text-xs font-normal">
                          {statusInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const act = activeSlots(r.validatorAssignments);
                          if (act.length === 0) {
                            if (r.status === "accepted") {
                              return (
                                <span className="text-muted-foreground text-sm">تکمیل شده</span>
                              );
                            }
                            if (r.status === "rejected") {
                              return <span className="text-muted-foreground text-sm">رد شده</span>;
                            }
                            return (
                              <span className="text-muted-foreground text-sm">در انتظار ورکر</span>
                            );
                          }
                          return (
                            <ul className="max-w-[200px] list-inside list-disc text-sm">
                              {act.map((a) => (
                                <li key={`${a.validator.id}-${a.assignedAt}`}>
                                  {a.validator.name}
                                  <span className="text-muted-foreground">
                                    {" "}
                                    ({a.validator.username})
                                  </span>
                                </li>
                              ))}
                            </ul>
                          );
                        })()}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const act = activeSlots(r.validatorAssignments);
                          const oldest = act.reduce(
                            (min, a) =>
                              !min || new Date(a.assignedAt) < new Date(min.assignedAt) ? a : min,
                            null as AssignmentRow | null,
                          );
                          return oldest ? (
                            <span className="text-[11px]">{formatDateTime(oldest.assignedAt)}</span>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          );
                        })()}
                      </TableCell>
                      <TableCell>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className="hover:bg-muted/40 flex min-h-9 w-full min-w-[120px] cursor-help items-center rounded-md px-1 py-2"
                              aria-label="جزئیات رأی‌ها"
                            >
                              <ReviewProgressBar
                                accepted={r.acceptedCount ?? 0}
                                rejected={r.rejectedCount ?? 0}
                                total={minApproved}
                              />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent
                            side="top"
                            sideOffset={6}
                            dir="rtl"
                            className="max-w-[260px] px-3 py-2 text-xs leading-relaxed"
                          >
                            تایید شده: {toPersianNum(r.acceptedCount ?? 0)} | رد:{" "}
                            {toPersianNum(r.rejectedCount ?? 0)} | در انتظار:{" "}
                            {toPersianNum(waitingVotes)}
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/admin/reports/${r.id}`}>
                            <Eye className="ml-1 h-4 w-4" />
                            جزئیات
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
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
    </div>
  );
}
