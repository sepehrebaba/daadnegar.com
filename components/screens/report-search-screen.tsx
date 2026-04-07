"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/edyen";
import { routes } from "@/lib/routes";
import { toPersianNum } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, FileText, ChevronLeft, ChevronRight, User } from "lucide-react";
import { useTranslation } from "react-i18next";

type Row = {
  id: string;
  status: string;
  title: string | null;
  description: string;
  createdAt: string;
  person: { firstName: string; lastName: string; nationalCode: string | null };
  user: { id: string; name: string; username: string };
  reviewCount: number;
  validatorAssignmentCount: number;
};

export function ReportSearchScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const reviewedByMe =
    searchParams.get("reviewedByMe") === "1" || searchParams.get("reviewedByMe") === "true";
  const [personQ, setPersonQ] = useState("");
  const [text, setText] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");
  const [minReviews, setMinReviews] = useState("");
  const [maxReviews, setMaxReviews] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 15;

  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [didSearch, setDidSearch] = useState(false);

  const statusLabels: Record<string, string> = {
    pending: t("report.search.statusPending"),
    accepted: t("report.search.statusAccepted"),
    rejected: t("report.search.statusRejected"),
  };

  const fetchPage = useCallback(
    async (p: number) => {
      setLoading(true);
      setError(null);
      const query: Record<string, string> = {
        page: String(p),
        perPage: String(perPage),
      };
      if (personQ.trim()) query.personQ = personQ.trim();
      if (text.trim()) query.text = text.trim();
      if (status !== "all") query.status = status;
      if (createdFrom) query.createdFrom = createdFrom;
      if (createdTo) query.createdTo = createdTo;
      if (minReviews.trim()) query.minReviews = minReviews.trim();
      if (maxReviews.trim()) query.maxReviews = maxReviews.trim();
      if (reviewedByMe) query.reviewedByMe = "true";

      const res = await api.reports.search.get({ query });
      setLoading(false);
      setDidSearch(true);
      if (res.error) {
        setError(
          typeof res.error === "object" && res.error && "message" in res.error
            ? String((res.error as { message?: string }).message)
            : t("report.search.error"),
        );
        setRows([]);
        setTotal(0);
        return;
      }
      const data = res.data as { data?: Row[]; total?: number; page?: number } | null;
      setRows(data?.data ?? []);
      setTotal(typeof data?.total === "number" ? data.total : 0);
      setPage(typeof data?.page === "number" ? data.page : p);
    },
    [
      personQ,
      text,
      status,
      createdFrom,
      createdTo,
      minReviews,
      maxReviews,
      perPage,
      reviewedByMe,
      t,
    ],
  );

  const onSearch = () => {
    setPage(1);
    void fetchPage(1);
  };

  useEffect(() => {
    if (!reviewedByMe) return;
    setPage(1);
    void fetchPage(1);
  }, [reviewedByMe, fetchPage]);

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  const openReport = (r: Row) => {
    if (r.status === "pending") {
      router.push(`/panel/approval/${r.id}`);
    } else {
      router.push(routes.requestDetail(r.id));
    }
  };

  return (
    <div className="bg-background flex flex-col p-4">
      <Card className="mx-auto w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-center text-xl font-bold">
            {reviewedByMe ? t("report.search.reviewedTitle") : t("report.search.title")}
          </CardTitle>
          <p className="text-muted-foreground mt-1 text-center text-sm">
            {reviewedByMe
              ? t("report.search.reviewedDescription")
              : t("report.search.searchDescription")}
          </p>
        </CardHeader>
        {!reviewedByMe && (
          <CardContent className="flex flex-col gap-4">
            <div className="space-y-2">
              <Label htmlFor="personQ">{t("report.search.personLabel")}</Label>
              <Input
                id="personQ"
                value={personQ}
                onChange={(e) => setPersonQ(e.target.value)}
                placeholder={t("report.search.personPlaceholder")}
                dir="rtl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="text">{t("report.search.textLabel")}</Label>
              <Input
                id="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={t("report.search.textPlaceholder")}
                dir="rtl"
              />
            </div>
            <div className="space-y-2">
              <Label>{t("report.search.statusLabel")}</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-full" dir="rtl">
                  <SelectValue placeholder={t("report.search.statusAll")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("report.search.statusAll")}</SelectItem>
                  <SelectItem value="pending">{t("report.search.statusPending")}</SelectItem>
                  <SelectItem value="accepted">{t("report.search.statusAccepted")}</SelectItem>
                  <SelectItem value="rejected">{t("report.search.statusRejected")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="createdFrom">{t("report.search.dateFromLabel")}</Label>
                <Input
                  id="createdFrom"
                  type="date"
                  value={createdFrom}
                  onChange={(e) => setCreatedFrom(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="createdTo">{t("report.search.dateToLabel")}</Label>
                <Input
                  id="createdTo"
                  type="date"
                  value={createdTo}
                  onChange={(e) => setCreatedTo(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="minReviews">{t("report.search.minReviewsLabel")}</Label>
                <Input
                  id="minReviews"
                  inputMode="numeric"
                  value={minReviews}
                  onChange={(e) => setMinReviews(e.target.value.replace(/\D/g, ""))}
                  placeholder="0"
                  dir="ltr"
                  className="text-end"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxReviews">{t("report.search.maxReviewsLabel")}</Label>
                <Input
                  id="maxReviews"
                  inputMode="numeric"
                  value={maxReviews}
                  onChange={(e) => setMaxReviews(e.target.value.replace(/\D/g, ""))}
                  placeholder={t("report.search.maxReviewsPlaceholder")}
                  dir="ltr"
                  className="text-end"
                />
              </div>
            </div>
            {error && <p className="text-destructive text-sm">{error}</p>}
            <Button type="button" className="w-full gap-2" onClick={onSearch} disabled={loading}>
              <Search className="h-4 w-4" />
              {loading ? t("report.search.searching") : t("report.search.submit")}
            </Button>
          </CardContent>
        )}
      </Card>

      {reviewedByMe && error && (
        <div className="text-destructive mx-auto mt-3 w-full max-w-lg text-sm">{error}</div>
      )}

      {rows.length > 0 && (
        <Card className="mx-auto mt-4 w-full max-w-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">
              {t("report.search.results", { count: toPersianNum(total) })}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {rows.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => openReport(r)}
                className="border-border hover:bg-muted/50 flex w-full flex-col gap-2 rounded-lg border p-3 text-start transition-colors"
              >
                <div className="flex items-start gap-2">
                  <div className="bg-primary/10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full">
                    <User className="text-primary h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">
                      {r.person.firstName} {r.person.lastName}
                    </div>
                    {r.title ? (
                      <div className="text-muted-foreground line-clamp-1 text-xs">{r.title}</div>
                    ) : null}
                    <div className="text-muted-foreground line-clamp-2 text-xs">
                      {r.description}
                    </div>
                  </div>
                </div>
                <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
                  <span>{new Date(r.createdAt).toLocaleDateString("fa-IR")}</span>
                  <span className="bg-muted rounded px-1.5 py-0.5">
                    {statusLabels[r.status] ?? r.status}
                  </span>
                  <span>
                    {t("report.search.reviewStats", {
                      reviews: toPersianNum(r.reviewCount),
                      validators: toPersianNum(r.validatorAssignmentCount),
                    })}
                  </span>
                </div>
              </button>
            ))}
            {totalPages > 1 && (
              <div className="mt-2 flex items-center justify-between gap-2 border-t pt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page <= 1 || loading}
                  onClick={() => {
                    const np = page - 1;
                    setPage(np);
                    void fetchPage(np);
                  }}
                >
                  <ChevronRight className="h-4 w-4" />
                  {t("common.previous")}
                </Button>
                <span className="text-muted-foreground text-sm">
                  {t("report.search.page", {
                    page: toPersianNum(page),
                    total: toPersianNum(totalPages),
                  })}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages || loading}
                  onClick={() => {
                    const np = page + 1;
                    setPage(np);
                    void fetchPage(np);
                  }}
                >
                  {t("common.next")}
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!loading && didSearch && rows.length === 0 && !error && (
        <div className="text-muted-foreground mx-auto mt-8 flex max-w-md flex-col items-center gap-2 px-4 text-center text-sm">
          <FileText className="h-10 w-10 opacity-40" />
          <p>{t("report.search.noResults")}</p>
        </div>
      )}

      <div className="mx-auto mt-6 w-full max-w-lg">
        <Button type="button" variant="outline" className="w-full" onClick={() => router.back()}>
          {t("common.back")}
        </Button>
      </div>
    </div>
  );
}
