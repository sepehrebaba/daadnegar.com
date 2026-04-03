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
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toPersianNum } from "@/lib/utils";
import { Eye, Filter, X } from "lucide-react";

type AssignmentRow = {
  assignedAt: Date | string;
  acceptedAt?: Date | string | null;
  reason: string;
  replacedAt?: Date | string | null;
  validator: { id: string; name: string; username: string };
};

function activeSlots(list?: AssignmentRow[]) {
  return (list ?? []).filter((a) => a.replacedAt == null);
}

type QueueReport = {
  id: string;
  status: string;
  description: string;
  createdAt: Date | string;
  assignedAt?: Date | string | null;
  person: { firstName: string; lastName: string };
  user: { name: string; username: string };
  assignedToUser?: { id: string; name: string; username: string } | null;
  validatorAssignments?: AssignmentRow[];
  reviews: { action: string; createdAt: Date | string; reviewerId?: string | null }[];
  city?: string | null;
  occurrenceDate?: string | null;
  wantsContact?: boolean | null;
  documents?: { id: string; name: string; url: string }[];
  category?: { id: string; name: string } | null;
  acceptedCount?: number;
  rejectedCount?: number;
  isPublic?: boolean;
};

type StatusFilter = "all" | "pending" | "accepted" | "rejected";
type HasDocumentsFilter = "all" | "with" | "without";
type ContactableFilter = "all" | "yes" | "no";
type PublicityFilter = "all" | "public" | "private";
type CategoryOption = {
  id: string;
  name: string;
  type?: string;
  isActive?: boolean;
};
type CityOption = { id: string; name: string };

function reportStatusLabel(status: string): {
  label: string;
  variant: "default" | "secondary" | "destructive";
} {
  if (status === "accepted") return { label: "تأیید شده", variant: "default" };
  if (status === "rejected") return { label: "رد شده", variant: "destructive" };
  return { label: "در انتظار بررسی", variant: "secondary" };
}

function formatDateTime(iso: Date | string) {
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
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [cities, setCities] = useState<CityOption[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [minApproved, setMinApproved] = useState(5);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [personFilter, setPersonFilter] = useState("");
  const [publicityFilter, setPublicityFilter] = useState<PublicityFilter>("all");
  const [hasDocumentsFilter, setHasDocumentsFilter] = useState<HasDocumentsFilter>("all");
  const [contactableFilter, setContactableFilter] = useState<ContactableFilter>("all");
  const [occurrenceDateFrom, setOccurrenceDateFrom] = useState("");
  const [occurrenceDateTo, setOccurrenceDateTo] = useState("");
  const [onlyWithActiveValidators, setOnlyWithActiveValidators] = useState(false);
  const [onlyNeedsVotes, setOnlyNeedsVotes] = useState(false);
  const [publicityTarget, setPublicityTarget] = useState<QueueReport | null>(null);
  const [redistributeTarget, setRedistributeTarget] = useState<QueueReport | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<QueueReport | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchQueue = async () => {
    setLoading(true);
    const base = typeof window !== "undefined" ? window.location.origin : "";
    const params = new URLSearchParams({
      page: String(page),
      perPage: "25",
    });
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (cityFilter !== "all") params.set("city", cityFilter);
    if (categoryFilter !== "all") params.set("categoryId", categoryFilter);
    if (personFilter.trim()) params.set("person", personFilter.trim());
    if (publicityFilter === "public") params.set("isPublic", "true");
    if (publicityFilter === "private") params.set("isPublic", "false");
    if (hasDocumentsFilter === "with") params.set("hasDocuments", "true");
    if (hasDocumentsFilter === "without") params.set("hasDocuments", "false");
    if (contactableFilter === "yes") params.set("wantsContact", "true");
    if (contactableFilter === "no") params.set("wantsContact", "false");
    if (occurrenceDateFrom) params.set("occurrenceDateFrom", occurrenceDateFrom);
    if (occurrenceDateTo) params.set("occurrenceDateTo", occurrenceDateTo);

    const queueRes = await fetch(`${base}/api/admin/reports/queue?${params.toString()}`, {
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
  }, [
    page,
    statusFilter,
    cityFilter,
    categoryFilter,
    personFilter,
    publicityFilter,
    hasDocumentsFilter,
    contactableFilter,
    occurrenceDateFrom,
    occurrenceDateTo,
  ]);

  useEffect(() => {
    const loadFilterOptions = async () => {
      const base = typeof window !== "undefined" ? window.location.origin : "";
      const [categoriesRes, citiesRes] = await Promise.all([
        fetch(`${base}/api/admin/categories`, { credentials: "include" }),
        fetch(`${base}/api/admin/cities`, { credentials: "include" }),
      ]);
      const categoriesData = await categoriesRes.json();
      const citiesData = await citiesRes.json();
      const reportCategories = (categoriesData?.data ?? []).filter(
        (c: CategoryOption) => (c.type == null || c.type === "report") && c.isActive !== false,
      );
      setCategories(reportCategories);
      setCities(citiesData?.data ?? []);
    };
    loadFilterOptions();
  }, []);

  useEffect(() => {
    setPage((prev) => (prev === 1 ? prev : 1));
  }, [
    statusFilter,
    cityFilter,
    categoryFilter,
    personFilter,
    publicityFilter,
    hasDocumentsFilter,
    contactableFilter,
    occurrenceDateFrom,
    occurrenceDateTo,
  ]);

  const activeFilterCount = [
    statusFilter !== "all",
    cityFilter !== "all",
    categoryFilter !== "all",
    personFilter.trim() !== "",
    publicityFilter !== "all",
    hasDocumentsFilter !== "all",
    contactableFilter !== "all",
    occurrenceDateFrom !== "",
    occurrenceDateTo !== "",
    onlyWithActiveValidators,
    onlyNeedsVotes,
  ].filter(Boolean).length;

  const filteredReports = reports.filter((report) => {
    const activeValidators = activeSlots(report.validatorAssignments).length;
    if (onlyWithActiveValidators && activeValidators === 0) return false;
    const waitingVotes = Math.max(
      0,
      minApproved - (report.acceptedCount ?? 0) - (report.rejectedCount ?? 0),
    );
    if (onlyNeedsVotes && waitingVotes === 0) return false;
    return true;
  });

  const resetFilters = () => {
    setStatusFilter("all");
    setCityFilter("all");
    setCategoryFilter("all");
    setPersonFilter("");
    setPublicityFilter("all");
    setHasDocumentsFilter("all");
    setContactableFilter("all");
    setOccurrenceDateFrom("");
    setOccurrenceDateTo("");
    setOnlyWithActiveValidators(false);
    setOnlyNeedsVotes(false);
  };

  const parseErrorMessage = async (res: Response, fallback: string) => {
    const text = await res.text();
    if (!text) return fallback;
    try {
      const json = JSON.parse(text) as {
        error?: { message?: string };
        message?: string;
      };
      return json?.error?.message || json?.message || fallback;
    } catch {
      return fallback;
    }
  };

  const changePublicity = async () => {
    if (!publicityTarget) return;
    setActionLoading(true);
    try {
      const base = typeof window !== "undefined" ? window.location.origin : "";
      const nextPublic = !publicityTarget.isPublic;
      const res = await fetch(`${base}/api/admin/reports/${publicityTarget.id}/publicity`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: nextPublic }),
      });
      if (!res.ok) {
        throw new Error(await parseErrorMessage(res, "تغییر عمومیت گزارش ناموفق بود"));
      }
      await fetchQueue();
      setPublicityTarget(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "تغییر عمومیت گزارش ناموفق بود");
    } finally {
      setActionLoading(false);
    }
  };

  const redistributeUnacceptedValidators = async () => {
    if (!redistributeTarget) return;
    setActionLoading(true);
    try {
      const base = typeof window !== "undefined" ? window.location.origin : "";
      const res = await fetch(
        `${base}/api/admin/reports/${redistributeTarget.id}/redistribute-unaccepted`,
        {
          method: "POST",
          credentials: "include",
        },
      );
      if (!res.ok) {
        throw new Error(await parseErrorMessage(res, "توزیع مجدد اعتبارسنجی ناموفق بود"));
      }
      await fetchQueue();
      setRedistributeTarget(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "توزیع مجدد اعتبارسنجی ناموفق بود");
    } finally {
      setActionLoading(false);
    }
  };

  const softDeleteReport = async () => {
    if (!deleteTarget) return;
    setActionLoading(true);
    try {
      const base = typeof window !== "undefined" ? window.location.origin : "";
      const res = await fetch(`${base}/api/admin/reports/${deleteTarget.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error(await parseErrorMessage(res, "حذف گزارش ناموفق بود"));
      }
      await fetchQueue();
      setDeleteTarget(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "حذف گزارش ناموفق بود");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">گزارش‌ها</h1>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" aria-label="فیلتر گزارشات" className="relative">
              <Filter className="h-4 w-4" />
              {activeFilterCount > 0 && (
                <span className="bg-primary text-primary-foreground absolute -top-1.5 -left-1.5 min-w-4 rounded-full px-1 text-center text-[10px] leading-4">
                  {toPersianNum(activeFilterCount)}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>فیلتر گزارشات</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="space-y-3 px-2 py-1.5" dir="rtl">
              <div className="space-y-1.5">
                <p className="text-muted-foreground text-xs">وضعیت</p>
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
                  className="border-input bg-background h-9 w-full rounded-md border px-2 text-sm"
                >
                  <option value="all">همه وضعیت‌ها</option>
                  <option value="pending">در انتظار بررسی</option>
                  <option value="accepted">تأیید شده</option>
                  <option value="rejected">رد شده</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <p className="text-muted-foreground text-xs">شهر</p>
                <select
                  value={cityFilter}
                  onChange={(event) => setCityFilter(event.target.value)}
                  className="border-input bg-background h-9 w-full rounded-md border px-2 text-sm"
                >
                  <option value="all">همه شهرها</option>
                  {cities.map((city) => (
                    <option key={city.id} value={city.name}>
                      {city.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <p className="text-muted-foreground text-xs">دسته‌بندی</p>
                <select
                  value={categoryFilter}
                  onChange={(event) => setCategoryFilter(event.target.value)}
                  className="border-input bg-background h-9 w-full rounded-md border px-2 text-sm"
                >
                  <option value="all">همه دسته‌ها</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <p className="text-muted-foreground text-xs">شخص</p>
                <Input
                  value={personFilter}
                  onChange={(event) => setPersonFilter(event.target.value)}
                  placeholder="نام یا نام خانوادگی شخص"
                  className="h-9 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <p className="text-muted-foreground text-xs">عمومیت گزارش</p>
                <select
                  value={publicityFilter}
                  onChange={(event) => setPublicityFilter(event.target.value as PublicityFilter)}
                  className="border-input bg-background h-9 w-full rounded-md border px-2 text-sm"
                >
                  <option value="all">همه</option>
                  <option value="public">فقط عمومی</option>
                  <option value="private">فقط خصوصی</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <p className="text-muted-foreground text-xs">دارای فایل</p>
                <select
                  value={hasDocumentsFilter}
                  onChange={(event) =>
                    setHasDocumentsFilter(event.target.value as HasDocumentsFilter)
                  }
                  className="border-input bg-background h-9 w-full rounded-md border px-2 text-sm"
                >
                  <option value="all">همه</option>
                  <option value="with">فقط دارای فایل</option>
                  <option value="without">فقط بدون فایل</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <p className="text-muted-foreground text-xs">قابل تماس</p>
                <select
                  value={contactableFilter}
                  onChange={(event) =>
                    setContactableFilter(event.target.value as ContactableFilter)
                  }
                  className="border-input bg-background h-9 w-full rounded-md border px-2 text-sm"
                >
                  <option value="all">همه</option>
                  <option value="yes">فقط قابل تماس</option>
                  <option value="no">فقط غیرقابل تماس</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <p className="text-muted-foreground text-xs">تاریخ وقوع از</p>
                  <Input
                    type="date"
                    dir="ltr"
                    value={occurrenceDateFrom}
                    onChange={(event) => setOccurrenceDateFrom(event.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <p className="text-muted-foreground text-xs">تا</p>
                  <Input
                    type="date"
                    dir="ltr"
                    value={occurrenceDateTo}
                    onChange={(event) => setOccurrenceDateTo(event.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
              </div>
            </div>

            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={onlyWithActiveValidators}
              onCheckedChange={(checked) => setOnlyWithActiveValidators(checked === true)}
              onSelect={(event) => event.preventDefault()}
            >
              فقط با اعتبارسنج فعال
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={onlyNeedsVotes}
              onCheckedChange={(checked) => setOnlyNeedsVotes(checked === true)}
              onSelect={(event) => event.preventDefault()}
            >
              فقط نیازمند رأی
            </DropdownMenuCheckboxItem>

            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={resetFilters}
              disabled={activeFilterCount === 0}
              className="text-muted-foreground"
            >
              <X className="h-4 w-4" />
              پاک کردن فیلترها
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Card>
        <CardHeader className="space-y-1">
          <CardTitle>گزارش‌ها</CardTitle>
          <p className="text-muted-foreground text-sm font-normal">
            در انتظار بررسی و تأییدشده (اکثریت رأی یا نهایی)
          </p>
        </CardHeader>
        <CardContent>
          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>شخص</TableHead>
                  <TableHead>کاربر</TableHead>
                  <TableHead>تاریخ ثبت</TableHead>
                  <TableHead>وضعیت</TableHead>
                  <TableHead>اعتبارسنج‌های فعال</TableHead>
                  <TableHead>شروع اسلات فعلی</TableHead>
                  <TableHead>نتایج رأی‌ها (تأیید / رد / در انتظار)</TableHead>
                  <TableHead></TableHead>
                  <TableHead>گزینه‌ها</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-muted-foreground py-8 text-center">
                      در حال بارگذاری...
                    </TableCell>
                  </TableRow>
                ) : reports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-muted-foreground py-8 text-center">
                      گزارشی برای نمایش وجود ندارد.
                    </TableCell>
                  </TableRow>
                ) : filteredReports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-muted-foreground py-8 text-center">
                      گزارشی با فیلترهای انتخاب‌شده پیدا نشد.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReports.map((r) => {
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
                          <span className="text-muted-foreground text-sm">
                            {" "}
                            ({r.user.username})
                          </span>
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
                                return (
                                  <span className="text-muted-foreground text-sm">رد شده</span>
                                );
                              }
                              return (
                                <span className="text-muted-foreground text-sm">
                                  در انتظار ورکر
                                </span>
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
                              <span className="text-[11px]">
                                {formatDateTime(oldest.assignedAt)}
                              </span>
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
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm">
                                گزینه‌ها
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                              <DropdownMenuItem onSelect={() => setPublicityTarget(r)}>
                                تغییر عمومیت گزارش
                              </DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => setRedistributeTarget(r)}>
                                توزیع مجدد اعتبارسنجی
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onSelect={() => setDeleteTarget(r)}
                                className="text-destructive focus:text-destructive"
                              >
                                حذف
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
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

      <Dialog
        open={publicityTarget != null}
        onOpenChange={(open) => !open && setPublicityTarget(null)}
      >
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>تغییر عمومیت گزارش</DialogTitle>
            <DialogDescription className="rounded-md border p-3 leading-relaxed">
              {publicityTarget?.isPublic ? (
                <>
                  این گزارش در حال حاضر <strong>عمومی</strong> است. با تایید شما{" "}
                  <strong>خصوصی</strong> می‌شود و دیگر برای کاربران پلتفرم قابل مشاهده نخواهد بود.
                </>
              ) : (
                <>
                  این گزارش در حال حاضر <strong>خصوصی</strong> است. با تایید شما{" "}
                  <strong>عمومی</strong> می‌شود و همه کاربران پلتفرم می‌توانند آن را ببینند.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row-reverse gap-2">
            <Button type="button" onClick={changePublicity} disabled={actionLoading}>
              {actionLoading ? "در حال انجام..." : "تایید"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPublicityTarget(null)}
              disabled={actionLoading}
            >
              انصراف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={redistributeTarget != null}
        onOpenChange={(open) => !open && setRedistributeTarget(null)}
      >
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>توزیع مجدد اعتبارسنجی</DialogTitle>
            <DialogDescription>
              اعتبارسنج‌هایی که هنوز بررسی را قبول نکرده‌اند، با اعتبارسنج جدید جایگزین می‌شوند.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <p className="font-medium">اعتبارسنج‌های فعال فعلی:</p>
            <div className="max-h-48 overflow-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>اعتبارسنج</TableHead>
                    <TableHead className="w-32">وضعیت</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeSlots(redistributeTarget?.validatorAssignments).map((slot) => (
                    <TableRow key={`${slot.validator.id}-${slot.assignedAt}`}>
                      <TableCell>
                        {slot.validator.name} ({slot.validator.username})
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={slot.acceptedAt ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {slot.acceptedAt ? "قبول کرده" : "در انتظار قبول"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {activeSlots(redistributeTarget?.validatorAssignments).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={2} className="text-muted-foreground">
                        اعتبارسنج فعال ندارد.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
          <DialogFooter className="flex-row-reverse gap-2">
            <Button
              type="button"
              onClick={redistributeUnacceptedValidators}
              disabled={actionLoading}
            >
              {actionLoading ? "در حال انجام..." : "تایید و توزیع مجدد"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setRedistributeTarget(null)}
              disabled={actionLoading}
            >
              انصراف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteTarget != null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>حذف گزارش</DialogTitle>
            <DialogDescription>
              این عملیات به‌صورت حذف نرم انجام می‌شود و گزارش از صف فعلی پنهان خواهد شد.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row-reverse gap-2">
            <Button
              type="button"
              variant="destructive"
              onClick={softDeleteReport}
              disabled={actionLoading}
            >
              {actionLoading ? "در حال حذف..." : "تایید حذف"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={actionLoading}
            >
              انصراف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
