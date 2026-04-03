"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/edyen";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CircleHelp, FileText, ChevronRight, ChevronLeft, User } from "lucide-react";
import { routes } from "@/lib/routes";
import type { ReportCase, ReviewerListStatus } from "@/types";
import { toPersianNum } from "@/lib/utils";

const BADGE_ROW_CLASS = "h-5 px-1.5 py-0 text-[10px] leading-none font-semibold shrink-0";

const BADGE_VARIANTS = {
  await_accept:
    "border-amber-500/50 bg-amber-100/90 text-amber-950 dark:bg-amber-950/50 dark:text-amber-50",
  await_vote: "border-sky-500/40 bg-sky-100/80 text-sky-950 dark:bg-sky-950/40 dark:text-sky-50",
  voted_accept:
    "border-emerald-600/40 bg-emerald-100/80 text-emerald-950 dark:bg-emerald-950/40 dark:text-emerald-50",
  voted_reject: "border-destructive/50 bg-destructive/15 text-destructive",
} as const;

function reviewerRowBadge(status: ReviewerListStatus | null | undefined): {
  label: string;
  badgeClassName: string;
} | null {
  if (!status) return null;
  switch (status.kind) {
    case "await_accept":
      return {
        label: "در انتظار پذیرش",
        badgeClassName: BADGE_VARIANTS.await_accept,
      };
    case "await_vote":
      return {
        label: "در انتظار رأی",
        badgeClassName: BADGE_VARIANTS.await_vote,
      };
    case "voted":
      return status.voteAction === "accepted"
        ? { label: "تأیید شده", badgeClassName: BADGE_VARIANTS.voted_accept }
        : { label: "رد شده", badgeClassName: BADGE_VARIANTS.voted_reject };
    default:
      return null;
  }
}

function getStatusLegendItems(): {
  label: string;
  badgeClass: string;
  text: string;
}[] {
  return [
    {
      label: "در انتظار پذیرش",
      badgeClass: BADGE_VARIANTS.await_accept,
      text: `در انتظار پذیرش توسط شما؛ حداکثر ${toPersianNum(24)} ساعت از زمان اختصاص برای قبول کردن بررسی مهلت دارید.`,
    },
    {
      label: "در انتظار رأی",
      badgeClass: BADGE_VARIANTS.await_vote,
      text: `منتظر اعتبارسنجی شما. برای اعتبارسنج‌ها تا ${toPersianNum(3)} روز پس از پذیرش مهلت ثبت رأی است؛ در غیر این صورت پس از مطالعهٔ گزارش رأی ثبت کنید.`,
    },
    {
      label: "تأیید شده",
      badgeClass: BADGE_VARIANTS.voted_accept,
      text: "رأی تأیید شما ثبت شده است؛ تا تکمیل حد نصاب آرا فقط امکان مشاهده وجود دارد.",
    },
    {
      label: "رد شده",
      badgeClass: BADGE_VARIANTS.voted_reject,
      text: "رأی رد شما ثبت شده است؛ تا تکمیل حد نصاب آرا فقط امکان مشاهده وجود دارد.",
    },
  ];
}

function StatusLegendTable() {
  const items = getStatusLegendItems();
  return (
    <div
      className="border-border bg-card overflow-hidden rounded-lg border"
      aria-label="راهنمای وضعیت‌ها"
    >
      <Table dir="rtl" className="text-xs">
        <TableHeader className="bg-muted/10 [&_th]:border-border dark:bg-muted/15 [&_th]:rounded-none [&_th]:border-b [&_th]:px-3 [&_th]:py-2 [&_th]:text-xs [&_th]:font-semibold [&_tr]:border-0">
          <TableRow className="border-0 bg-transparent hover:bg-transparent">
            <TableHead className="text-foreground w-[30%] max-w-22">نشان در لیست</TableHead>
            <TableHead className="text-foreground">توضیح</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow
              key={item.label}
              className="border-border hover:bg-muted/10 bg-background dark:bg-background/80 dark:hover:bg-muted/15 border-b last:border-b-0"
            >
              <TableCell className="py-2.5 align-middle">
                <Badge variant="outline" className={`${BADGE_ROW_CLASS} ${item.badgeClass}`}>
                  {item.label}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground py-2.5 align-middle text-[11px] leading-relaxed whitespace-normal">
                {item.text}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function ApprovalListScreen() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [pendingRequests, setPendingRequests] = useState<ReportCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [legendOpen, setLegendOpen] = useState(false);
  const itemsPerPage = 5;

  useEffect(() => {
    api.reports.pending
      .get()
      .then(({ data, error }) => {
        if (error) throw new Error(String(error));
        setPendingRequests((data ?? []) as unknown as ReportCase[]);
      })
      .catch(() => setPendingRequests([]))
      .finally(() => setLoading(false));
  }, []);
  const totalPages = Math.ceil(pendingRequests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentRequests = pendingRequests.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="bg-background flex flex-col p-4">
      <Card className="mx-auto flex w-full max-w-md flex-1 flex-col">
        <CardHeader>
          <CardTitle className="text-foreground text-center text-xl font-bold">
            لیست انتظار بررسی
          </CardTitle>
          <p className="text-muted-foreground mt-1 text-center text-sm">
            درخواست‌های در انتظار بررسی
          </p>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col gap-3">
          {loading ? (
            <div className="text-muted-foreground flex min-h-[330px] items-center justify-center gap-3">
              در حال بارگذاری...
            </div>
          ) : currentRequests.length === 0 ? (
            <div className="text-muted-foreground flex min-h-[330px] items-center justify-center gap-3">
              <FileText className="text-muted-foreground/40 mb-3 h-10 w-10" />
              <p className="text-muted-foreground/50 text-center text-lg font-bold">
                هیچ درخواستی در انتظار تایید نیست
              </p>
            </div>
          ) : (
            currentRequests.map((request) => {
              const rowBadge = reviewerRowBadge(request.listReviewerStatus);
              return (
                <div key={request.id} className="border-border overflow-hidden rounded-lg border">
                  <div className="hover:bg-muted/50 flex items-center gap-3 p-4">
                    <div className="bg-primary/10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
                      <User className="text-primary h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-foreground font-medium">
                        {request.person.firstName} {request.person.lastName}
                      </div>
                      <div className="text-muted-foreground mt-0.5 text-xs">
                        {new Date(request.createdAt).toLocaleDateString("fa-IR")}
                      </div>
                      {rowBadge && (
                        <div className="mt-1.5 flex flex-wrap items-center gap-1">
                          <Badge
                            variant="outline"
                            className={`${BADGE_ROW_CLASS} w-fit ${rowBadge.badgeClassName}`}
                          >
                            {rowBadge.label}
                          </Badge>
                          <button
                            type="button"
                            onClick={() => setLegendOpen(true)}
                            className="text-muted-foreground hover:text-foreground focus-visible:ring-ring inline-flex size-6 shrink-0 items-center justify-center rounded-full transition-colors focus-visible:ring-2 focus-visible:outline-none"
                            aria-label="راهنمای وضعیت‌ها"
                            title="راهنمای وضعیت‌ها"
                          >
                            <CircleHelp className="size-3.5" strokeWidth={2} />
                          </button>
                        </div>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0 self-start"
                      onClick={() => router.push(`/panel/approval/${request.id}`)}
                    >
                      جزئیات
                    </Button>
                  </div>
                </div>
              );
            })
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <span className="text-muted-foreground text-sm">
                صفحه {currentPage} از {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
          )}

          <Dialog open={legendOpen} onOpenChange={setLegendOpen}>
            <DialogContent
              className="max-w-[calc(100%-1.5rem)] gap-3 p-4 sm:max-w-md"
              scrollable
              showCloseButton
            >
              <DialogHeader className="gap-1 space-y-0 text-center sm:text-center">
                <DialogTitle className="text-base">راهنمای وضعیت‌ها</DialogTitle>
              </DialogHeader>
              <div className="min-h-0 flex-1 overflow-y-auto pe-1">
                <StatusLegendTable />
              </div>
            </DialogContent>
          </Dialog>

          <Button
            onClick={() => router.replace(routes.mainMenu)}
            variant="ghost"
            className="mt-auto"
          >
            بازگشت
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
