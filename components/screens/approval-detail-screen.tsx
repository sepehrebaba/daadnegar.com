"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, getPendingReportDetail } from "@/lib/edyen";
import { toPersianNum } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  ArrowRight,
  Building2,
  Calendar,
  Check,
  ClipboardCheck,
  FileText,
  MapPin,
  MessageSquare,
  User,
  X,
  Mail,
  CheckCheckIcon,
} from "lucide-react";

const MIN_COMMENT_LEN = 10;

const GOOD_FAITH_OPTIONS: { value: string; label: string; hint: string }[] = [
  {
    value: "R1",
    label: "R1 — مدارک ناکافی",
    hint: "اطلاعات در خلاصه هست ولی ناکافی یا ناقص است.",
  },
  {
    value: "R2",
    label: "R2 — خارج از محدوده",
    hint: "موضوع جزو فساد عمومی / محدوده سامانه نیست.",
  },
  {
    value: "R3",
    label: "R3 — تکراری",
    hint: "همان پرونده یا گزارش تکراری ارسال شده است.",
  },
  {
    value: "R4",
    label: "R4 — مبهم / فیلدهای ناقص",
    hint: "شرح یا فیلدها بیش از حد کلی یا ناقص است.",
  },
  {
    value: "R5",
    label: "R5 — ریسک امنیتی",
    hint: "محتوا ریسک امنیتی برای اشخاص یا سامانه دارد.",
  },
];

const BAD_FAITH_OPTIONS: { value: string; label: string; hint: string }[] = [
  {
    value: "B1",
    label: "B1 — مدارک جعلی یا دستکاری‌شده",
    hint: "سند ساختگی یا دست‌کاری‌شده است.",
  },
  {
    value: "B2",
    label: "B2 — اسپم هماهنگ‌شده",
    hint: "الگوی اسپم یا هماهنگ‌شده مشاهده می‌شود.",
  },
  {
    value: "B3",
    label: "B3 — Doxxing / افشای عمدی",
    hint: "تلاش برای افشای غیرمجاز اطلاعات شخصی.",
  },
  {
    value: "B4",
    label: "B4 — آزار، نفرت‌پراکنی یا تهدید",
    hint: "محتوای آزاردهنده یا تهدیدآمیز.",
  },
  {
    value: "B5",
    label: "B5 — جعل هویت",
    hint: "جعل هویت گزارش‌دهنده یا شخص گزارش‌شده.",
  },
  {
    value: "B6",
    label: "B6 — باج‌گیری یا اخاذی",
    hint: "انگیزه باج‌گیری یا اخاذی مشهود است.",
  },
];

type ReportDetail = {
  id: string;
  title?: string | null;
  description: string;
  status: string;
  organizationType?: string | null;
  organizationName?: string | null;
  province?: string | null;
  city?: string | null;
  exactLocation?: string | null;
  occurrenceFrequency?: string | null;
  occurrenceDate?: string | null;
  hasEvidence?: boolean | null;
  evidenceTypes?: string | null;
  evidenceDescription?: string | null;
  wantsContact?: boolean | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  contactSocial?: string | null;
  createdAt: string;
  person: {
    id: string;
    firstName: string;
    lastName: string;
    nationalCode?: string | null;
    title?: string | null;
    isFamous?: boolean;
  };
  user: { id: string; name: string; username: string };
  category?: { id: string; name: string; slug: string } | null;
  subcategory?: { id: string; name: string; slug: string } | null;
  documents: { id: string; name: string; url: string }[];
  consensus?: {
    minReviews: number;
    acceptedVotes: number;
    rejectedVotes: number;
    goodFaithRejectVotes: number;
    badFaithRejectVotes: number;
    validatorVotesTotal: number;
    myReviewAction: string | null;
    myRejectionTier: string | null;
    myAcceptedAt: string | null;
  };
};

function InfoRow({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value?: string | null;
  icon?: React.ElementType;
}) {
  if (value == null || value === "") return null;
  return (
    <div className="flex items-start gap-2 text-sm">
      {Icon && <Icon className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />}
      <div>
        <span className="text-muted-foreground">{label}: </span>
        <span className="text-foreground">{value}</span>
      </div>
    </div>
  );
}

export function ApprovalDetailScreen() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string | undefined;
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectTier, setRejectTier] = useState<"good_faith" | "bad_faith">("good_faith");
  const [rejectCode, setRejectCode] = useState("R1");
  const [rejectComment, setRejectComment] = useState("");
  const [approveComment, setApproveComment] = useState("");
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [approveError, setApproveError] = useState<string | null>(null);
  const [rejectError, setRejectError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [acceptingReview, setAcceptingReview] = useState(false);

  useEffect(() => {
    if (!id) return;
    getPendingReportDetail(id)
      .then((data) => {
        setReport(data as ReportDetail);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "خطا در بارگذاری گزارش");
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    const opts = rejectTier === "good_faith" ? GOOD_FAITH_OPTIONS : BAD_FAITH_OPTIONS;
    if (!opts.some((o) => o.value === rejectCode)) {
      setRejectCode(opts[0].value);
    }
  }, [rejectTier, rejectCode]);

  const reloadDetail = async () => {
    if (!id) return;
    try {
      const data = await getPendingReportDetail(id);
      setReport(data as ReportDetail);
      setError(null);
    } catch {
      router.push("/panel/approval-list");
    }
  };

  const handleAcceptReview = async () => {
    if (!id) return;
    setError(null);
    setAcceptingReview(true);
    try {
      await api.reports({ id })["accept-review"].put();
      await reloadDetail();
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطا در پذیرش اعتبارسنجی");
    }
    setAcceptingReview(false);
  };

  const handleApprove = async () => {
    if (!id) return;
    const c = approveComment.trim();
    if (c.length < MIN_COMMENT_LEN) {
      setApproveError(`برای تأیید، شرح نظر شما باید حداقل ${MIN_COMMENT_LEN} نویسه باشد.`);
      return;
    }
    setApproveError(null);
    setActionLoading(true);
    try {
      await api.reports({ id }).approve.put({ comment: c });
      setApproveDialogOpen(false);
      setApproveComment("");
      await reloadDetail();
    } catch (e) {
      setApproveError(e instanceof Error ? e.message : "خطا در تایید");
    }
    setActionLoading(false);
  };

  const handleReject = async () => {
    if (!id) return;
    const c = rejectComment.trim();
    if (c.length < MIN_COMMENT_LEN) {
      setRejectError(`برای رد، شرح نظر شما باید حداقل ${MIN_COMMENT_LEN} نویسه باشد.`);
      return;
    }
    setRejectError(null);
    setActionLoading(true);
    try {
      await api.reports({ id }).reject.put({
        rejectionTier: rejectTier,
        rejectionCode: rejectCode,
        comment: c,
      });
      setRejectDialogOpen(false);
      setRejectComment("");
      await reloadDetail();
    } catch (e) {
      setRejectError(e instanceof Error ? e.message : "خطا در رد");
    }
    setActionLoading(false);
  };

  if (!id) {
    router.replace("/panel/approval-list");
    return null;
  }

  if (loading) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center p-4">
        <p className="text-muted-foreground">در حال بارگذاری...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="bg-background flex min-h-screen flex-col items-center justify-center gap-4 p-4">
        <p className="text-destructive text-center">{error || "گزارش یافت نشد"}</p>
        <Button variant="outline" onClick={() => router.push("/panel/approval-list")}>
          بازگشت به لیست
        </Button>
      </div>
    );
  }

  const c = report.consensus;
  const userHasReviewed = c?.myReviewAction != null && c.myReviewAction !== "";
  const hasAcceptedReview = c?.myAcceptedAt != null;
  const readOnly = report.status !== "pending" || userHasReviewed;

  const statusBadgeLabel =
    report.status === "accepted"
      ? "تأیید نهایی (اکثریت رأی)"
      : report.status === "rejected"
        ? "رد نهایی (اکثریت رأی)"
        : c != null
          ? `جمع‌آوری رأی: ${toPersianNum(c.validatorVotesTotal)} از ${toPersianNum(c.minReviews)} — تأیید ${toPersianNum(c.acceptedVotes)}، رد حسن‌نیت ${toPersianNum(c.goodFaithRejectVotes ?? 0)}، رد سوءنیت ${toPersianNum(c.badFaithRejectVotes ?? 0)}`
          : "در انتظار جمع‌آوری رأی اعتبارسنج‌ها";

  const codeOptions = rejectTier === "good_faith" ? GOOD_FAITH_OPTIONS : BAD_FAITH_OPTIONS;
  const selectedCodeHint = codeOptions.find((o) => o.value === rejectCode)?.hint ?? "";

  return (
    <div className="bg-background flex flex-col p-4">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-1 items-start gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/panel/approval-list")}
            className="shrink-0"
          >
            <ArrowRight className="h-5 w-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-foreground mb-2 text-center text-lg font-bold sm:text-right">
              جزئیات گزارش {report.person.firstName} {report.person.lastName}
            </h1>
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <Badge
                variant={
                  report.status === "accepted"
                    ? "default"
                    : report.status === "rejected"
                      ? "destructive"
                      : "secondary"
                }
                className="max-w-full text-right leading-snug whitespace-normal"
              >
                {statusBadgeLabel}
              </Badge>
              {userHasReviewed && report.status === "pending" && (
                <Badge variant="outline" className="border-primary text-primary">
                  بررسی شده
                </Badge>
              )}
            </div>
          </div>
        </div>
        {!readOnly && !hasAcceptedReview && (
          <div className="border-border bg-muted/30 flex items-center gap-6 rounded-lg border p-1.5 sm:max-w-md">
            <span className="text-muted-foreground text-xs">
              اگر قصد تایید اعتبارسنجی را دارید، لطفاً پذیرش کنید.
            </span>
            <Button
              onClick={handleAcceptReview}
              disabled={acceptingReview}
              size="sm"
              className="gap-1.5 bg-blue-600 text-white hover:bg-blue-700"
            >
              <ClipboardCheck className="h-4 w-4" />
              {acceptingReview ? "در حال پذیرش…" : "پذیرش اعتبارسنجی"}
            </Button>
          </div>
        )}
        {!readOnly && hasAcceptedReview && (
          <div className="border-border bg-muted/30 flex items-center gap-6 rounded-lg border p-1.5 sm:max-w-md">
            <span className="text-muted-foreground text-xs">
              لطفا پس از بررسی کامل گزارش، رأی خود را ثبت کنید.
            </span>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setApproveError(null);
                  setApproveDialogOpen(true);
                }}
                disabled={actionLoading}
                size="sm"
                className="gap-1.5 bg-green-600 text-white hover:bg-green-700"
              >
                <Check className="h-4 w-4" />
                تایید
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  setRejectError(null);
                  setRejectDialogOpen(true);
                  P;
                }}
                disabled={actionLoading}
                className="gap-1.5"
              >
                <X className="h-4 w-4" />
                رد
              </Button>
            </div>
          </div>
        )}
        {readOnly && report.status === "pending" && userHasReviewed && (
          <div className="border-border bg-muted/20 flex flex-col items-center gap-2 rounded-lg border p-1.5 sm:max-w-md">
            <p className="text-muted-foreground flex items-center gap-2 text-center text-xs sm:text-right">
              <CheckCheckIcon className="h-4 w-4" />
              رأی شما ثبت شده است؛ تا تکمیل حد نصاب‌ آرا فقط امکان مشاهده وجود دارد.
            </p>

            <div className="bg-card flex gap-2 rounded-md border px-2 *:p-1">
              <span className="text-muted-foreground text-xs">رای شما: </span>
              <strong
                className={`text-xs ${c?.myReviewAction === "accepted" ? "text-green-600" : "text-red-600"}`}
              >
                {c?.myReviewAction === "accepted" ? "تایید" : "رد"}
              </strong>
              {c?.myReviewAction === "rejected" && (
                <>
                  <span className="text-muted-foreground text-xs">کد دلیل:</span>

                  <strong
                    className={`text-xs ${c?.myRejectionTier === "good_faith" ? "text-green-600" : "text-red-600"}`}
                  >
                    {c?.myRejectionTier}
                  </strong>
                </>
              )}
              <span className="text-muted-foreground text-xs">
                شرح دلیل: {c?.myReviewAction === "rejected" ? c?.myRejectionTier : ""}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* شخص گزارش‌شده */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <User className="h-5 w-5" />
                  شخص گزارش‌شده
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <InfoRow
                  label="نام"
                  value={`${report.person.firstName} ${report.person.lastName}`}
                  icon={User}
                />
                <InfoRow label="کد ملی" value={report.person.nationalCode} />
                <InfoRow label="عنوان/سمت" value={report.person.title} />
              </CardContent>
            </Card>

            {/* کاربر ثبت‌کننده */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <User className="h-5 w-5" />
                  کاربر ثبت‌کننده
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <InfoRow label="نام" value={report.user.name} icon={User} />
                <InfoRow label="نام کاربری" value={report.user.username} icon={User} />
              </CardContent>
            </Card>
          </div>

          {/* شرح */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageSquare className="h-5 w-5" />
                شرح گزارش
              </CardTitle>
              {(report.category || report.subcategory || report.title) && (
                <div className="flex flex-wrap gap-2 text-sm">
                  {report.title && <span className="text-muted-foreground">{report.title}</span>}
                  {report.category && (
                    <span className="text-muted-foreground">• {report.category.name}</span>
                  )}
                  {report.subcategory && (
                    <span className="text-muted-foreground">• {report.subcategory.name}</span>
                  )}
                </div>
              )}
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
                {report.description}
              </p>
            </CardContent>
          </Card>

          {/* سازمان و مکان */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="h-5 w-5" />
                سازمان و مکان
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <InfoRow label="نوع سازمان" value={report.organizationType} icon={Building2} />
              <InfoRow label="نام سازمان" value={report.organizationName} />
              <InfoRow label="استان" value={report.province} icon={MapPin} />
              <InfoRow label="شهر" value={report.city} icon={MapPin} />
              <InfoRow label="آدرس دقیق" value={report.exactLocation} icon={MapPin} />
            </CardContent>
          </Card>

          {/* زمان و شواهد */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-5 w-5" />
                زمان و شواهد
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <InfoRow
                label="تاریخ وقوع"
                value={
                  report.occurrenceDate
                    ? new Date(report.occurrenceDate).toLocaleDateString("fa-IR")
                    : null
                }
                icon={Calendar}
              />
              <InfoRow label="تکرار وقوع" value={report.occurrenceFrequency} />
              {report.hasEvidence != null && (
                <div className="text-sm">
                  <span className="text-muted-foreground">دارای شواهد: </span>
                  <span>{report.hasEvidence ? "بله" : "خیر"}</span>
                </div>
              )}
              <InfoRow label="نوع شواهد" value={report.evidenceTypes} />
              <InfoRow label="توضیح شواهد" value={report.evidenceDescription} />
            </CardContent>
          </Card>

          {/* تماس */}
          {(report.wantsContact ||
            report.contactEmail ||
            report.contactPhone ||
            report.contactSocial) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Mail className="h-5 w-5" />
                  تماس
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <InfoRow label="ایمیل تماس" value={report.contactEmail} icon={Mail} />
                <InfoRow label="تلفن تماس" value={report.contactPhone} />
                <InfoRow label="شبکه اجتماعی" value={report.contactSocial} />
              </CardContent>
            </Card>
          )}

          {/* اسناد */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-5 w-5" />
                اسناد ({report.documents?.length ?? 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!report.documents?.length ? (
                <p className="text-muted-foreground text-sm">سندی ثبت نشده</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {report.documents.map((doc) => (
                    <a
                      key={doc.id}
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:bg-accent inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-colors"
                    >
                      <FileText className="h-4 w-4" />
                      {doc.name}
                    </a>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.push("/panel/approval-list")}
          >
            بازگشت به لیست
          </Button>
        </div>

        <Dialog
          open={approveDialogOpen}
          onOpenChange={(open) => {
            setApproveDialogOpen(open);
            if (!open) setApproveError(null);
          }}
        >
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>تأیید گزارش</DialogTitle>
              <DialogDescription className="text-right leading-relaxed">
                لطفاً دلیل تأیید خود را با ارجاع به خلاصه و اسناد بنویسید.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {approveError && (
                <p className="text-destructive rounded-md border border-red-200 bg-red-50 p-2 text-sm dark:border-red-900 dark:bg-red-950">
                  {approveError}
                </p>
              )}
              <div className="space-y-2">
                <Label htmlFor="approve-comment">
                  شرح نظر شما <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="approve-comment"
                  dir="rtl"
                  placeholder="حداقل ۱۰ نویسه: جمع‌بندی دلیل تأیید و ارجاع به خلاصه/اسناد…"
                  value={approveComment}
                  onChange={(e) => setApproveComment(e.target.value)}
                  rows={4}
                  className="resize-y text-sm"
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>
                انصراف
              </Button>
              <Button
                onClick={handleApprove}
                disabled={actionLoading}
                className="gap-1.5 bg-green-600 text-white hover:bg-green-700"
              >
                <Check className="h-4 w-4" />
                ثبت تأیید
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={rejectDialogOpen}
          onOpenChange={(open) => {
            setRejectDialogOpen(open);
            if (!open) setRejectError(null);
          }}
        >
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>رد گزارش با کد دلیل</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {rejectError && (
                <p className="text-destructive rounded-md border border-red-200 bg-red-50 p-2 text-sm dark:border-red-900 dark:bg-red-950">
                  {rejectError}
                </p>
              )}
              <div className="space-y-2">
                <Label className="text-sm font-medium">نوع رد</Label>
                <RadioGroup
                  value={rejectTier}
                  onValueChange={(v) => setRejectTier(v as "good_faith" | "bad_faith")}
                  className="flex flex-col gap-2"
                >
                  <label className="flex cursor-pointer items-start gap-2 rounded-md border p-3 text-sm">
                    <RadioGroupItem value="good_faith" id="tier-g" className="mt-0.5" />
                    <span>
                      <span className="font-medium" id="tier-g-label">
                        رد با حسن‌نیت
                      </span>
                      <span className="text-muted-foreground block text-xs">
                        بازپرداخت جزئی به گزارش‌دهنده در صورت اجماع
                      </span>
                    </span>
                  </label>
                  <label className="flex cursor-pointer items-start gap-2 rounded-md border p-3 text-sm">
                    <RadioGroupItem value="bad_faith" id="tier-b" className="mt-0.5" />
                    <span>
                      <span className="font-medium">رد با سوءنیت</span>
                      <span className="text-muted-foreground block text-xs">
                        جریمه سنگین‌تر در صورت اجماع
                      </span>
                    </span>
                  </label>
                </RadioGroup>
              </div>
              <div className="space-y-2">
                <Label>کد دلیل</Label>
                <Select value={rejectCode} onValueChange={setRejectCode}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {codeOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedCodeHint ? (
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    {selectedCodeHint}
                  </p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="reject-comment">
                  شرح نظر شما <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="reject-comment"
                  dir="rtl"
                  placeholder="حداقل ۱۰ نویسه: توضیح دقیق با ارجاع به متن گزارش یا اسناد…"
                  value={rejectComment}
                  onChange={(e) => setRejectComment(e.target.value)}
                  rows={4}
                  className="resize-y text-sm"
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
                انصراف
              </Button>
              <Button variant="destructive" onClick={handleReject} disabled={actionLoading}>
                ثبت رد
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
