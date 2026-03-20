"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, getPendingReportDetail } from "@/lib/edyen";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowRight,
  Building2,
  Calendar,
  Check,
  FileText,
  MapPin,
  MessageSquare,
  User,
  X,
} from "lucide-react";

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
  const [rejectReason, setRejectReason] = useState<"false" | "problematic">("problematic");
  const [actionLoading, setActionLoading] = useState(false);

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

  const handleApprove = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      await api.reports({ id }).approve.put();
      router.push("/panel/approval-list");
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطا در تایید");
    }
    setActionLoading(false);
  };

  const handleReject = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      await api.reports({ id }).reject.put({ rejectionReason: rejectReason });
      setRejectDialogOpen(false);
      router.push("/panel/approval-list");
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطا در رد");
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

  return (
    <div className="bg-background flex flex-col p-4">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/panel/approval-list")}
            className="shrink-0"
          >
            <ArrowRight className="h-5 w-5" />
          </Button>
          <h1 className="text-foreground min-w-0 flex-1 truncate text-center text-lg font-bold">
            جزئیات گزارش {report.person.firstName} {report.person.lastName}
          </h1>
          <Badge
            variant={
              report.status === "accepted"
                ? "default"
                : report.status === "rejected"
                  ? "destructive"
                  : "secondary"
            }
          >
            {report.status === "accepted"
              ? `تأیید شده توسط X نفر`
              : report.status === "rejected"
                ? `رد شده توسط X نفر`
                : `در انتظار بررسی توسط X نفر`}
          </Badge>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button
            onClick={handleApprove}
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
            onClick={() => setRejectDialogOpen(true)}
            disabled={actionLoading}
            className="gap-1.5"
          >
            <X className="h-4 w-4" />
            رد
          </Button>
        </div>
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

        <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>دلیل رد گزارش</DialogTitle>
              <DialogDescription>
                لطفاً دلیل رد را انتخاب کنید:
                <br />
                <strong>رد نرم (نقص یا افشای اطلاعات):</strong> امتیاز کمتری کسر می‌شود.
                <br />
                <strong>رد سخت (گزارش اشتباه یا قصد تخریب):</strong> امتیاز بیشتری کسر می‌شود.
              </DialogDescription>
            </DialogHeader>
            <Select
              value={rejectReason}
              onValueChange={(v) => setRejectReason(v as "false" | "problematic")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="problematic">رد نرم (نقص یا افشای اطلاعات)</SelectItem>
                <SelectItem value="false">رد سخت (گزارش اشتباه یا قصد تخریب)</SelectItem>
              </SelectContent>
            </Select>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
                انصراف
              </Button>
              <Button variant="destructive" onClick={handleReject} disabled={actionLoading}>
                رد گزارش
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
