"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/edyen";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Building2,
  Calendar,
  FileText,
  MapPin,
  MessageSquare,
  User,
} from "lucide-react";

type ReportReview = {
  id: string;
  action: string;
  rejectionReason?: string | null;
  createdAt: string;
  reviewerId?: string | null;
};

type ReportDetail = {
  id: string;
  title?: string | null;
  description: string;
  status: string;
  rejectionReason?: string | null;
  reviewedAt?: string | null;
  reviews?: ReportReview[];
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
  updatedAt: string;
  person: {
    id: string;
    firstName: string;
    lastName: string;
    nationalCode?: string | null;
    imageUrl?: string | null;
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

export default function AdminReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string | undefined;
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    api.admin
      .reports({ id })
      .get()
      .then(({ data, error: err }) => {
        if (err) {
          setError(err instanceof Error ? err.message : "خطا در بارگذاری گزارش");
          setLoading(false);
          return;
        }
        if (data) {
          setReport(data as ReportDetail);
        } else {
          setError("گزارش یافت نشد");
        }
        setLoading(false);
      });
  }, [id]);

  const statusBadge = (s: string) => {
    const v = s === "accepted" ? "default" : s === "rejected" ? "destructive" : "secondary";
    const label = s === "accepted" ? "تأیید شده" : s === "rejected" ? "رد شده" : "در انتظار بررسی";
    return <Badge variant={v}>{label}</Badge>;
  };

  const rejectionLabel = (r?: string | null) => {
    if (!r) return null;
    return r === "false" ? "گزارش اشتباه یا قصد تخریب" : "نقص یا افشای اطلاعات";
  };

  if (!id) {
    router.replace("/admin/reports");
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-muted-foreground">در حال بارگذاری...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="space-y-4">
        <p className="text-destructive">{error || "گزارش یافت نشد"}</p>
        <Button variant="outline" asChild>
          <Link href="/admin/reports">بازگشت به لیست گزارش‌ها</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/reports">
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              جزئیات گزارش {report.person.firstName} {report.person.lastName}
            </h1>
            <div className="mt-1 flex items-center gap-2">
              {statusBadge(report.status)}
              {report.rejectionReason && (
                <span className="text-muted-foreground text-sm">
                  ({rejectionLabel(report.rejectionReason)})
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* شخص گزارش‌شده */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
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
            {report.person.isFamous != null && (
              <div className="text-sm">
                <span className="text-muted-foreground">فرد معروف: </span>
                <span>{report.person.isFamous ? "بله" : "خیر"}</span>
              </div>
            )}
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/people">لیست افراد</Link>
            </Button>
          </CardContent>
        </Card>

        {/* کاربر ثبت‌کننده */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              کاربر ثبت‌کننده
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <InfoRow label="نام" value={report.user.name} icon={User} />
            <InfoRow label="نام کاربری" value={report.user.username} icon={User} />
            <Button variant="outline" size="sm" asChild>
              <Link href={`/admin/users?q=${encodeURIComponent(report.user.username)}`}>
                مشاهده کاربر
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* شرح و دسته‌بندی */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              شرح گزارش
            </CardTitle>
            {(report.category || report.subcategory || report.title) && (
              <div className="flex flex-wrap gap-2 text-sm">
                {report.title && <Badge variant="outline">{report.title}</Badge>}
                {report.category && <Badge variant="secondary">{report.category.name}</Badge>}
                {report.subcategory && <Badge variant="secondary">{report.subcategory.name}</Badge>}
              </div>
            )}
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {report.description}
            </p>
          </CardContent>
        </Card>

        {/* سازمان و مکان */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
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
            <CardTitle className="flex items-center gap-2">
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
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                تماس
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {report.wantsContact != null && (
                <div className="text-sm">
                  <span className="text-muted-foreground">تمایل به تماس: </span>
                  <span>{report.wantsContact ? "بله" : "خیر"}</span>
                </div>
              )}
              <InfoRow label="ایمیل تماس" value={report.contactEmail} icon={Mail} />
              <InfoRow label="تلفن تماس" value={report.contactPhone} />
              <InfoRow label="شبکه اجتماعی" value={report.contactSocial} />
            </CardContent>
          </Card>
        )}

        {/* اسناد */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              اسناد ({report.documents.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {report.documents.length === 0 ? (
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

        {/* اطلاعات اداری */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>اطلاعات اداری</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4 text-sm">
            <span>
              <span className="text-muted-foreground">تاریخ ثبت: </span>
              {new Date(report.createdAt).toLocaleDateString("fa-IR", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            <span>
              <span className="text-muted-foreground">آخرین بروزرسانی: </span>
              {new Date(report.updatedAt).toLocaleDateString("fa-IR", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            {report.reviewedAt && (
              <span>
                <span className="text-muted-foreground">تاریخ بررسی: </span>
                {new Date(report.reviewedAt).toLocaleDateString("fa-IR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}
          </CardContent>
        </Card>

        {/* بررسی‌ها */}
        {report.reviews && report.reviews.length > 0 && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>بررسی‌ها ({report.reviews.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {report.reviews.map((r) => (
                  <div
                    key={r.id}
                    className="flex flex-wrap items-center gap-2 rounded-lg border p-3 text-sm"
                  >
                    <Badge variant={r.action === "accepted" ? "default" : "destructive"}>
                      {r.action === "accepted" ? "تأیید" : "رد"}
                    </Badge>
                    {r.rejectionReason && (
                      <span className="text-muted-foreground">
                        (
                        {r.rejectionReason === "false"
                          ? "گزارش اشتباه/قصد تخریب"
                          : "نقص یا افشای اطلاعات"}
                        )
                      </span>
                    )}
                    <span className="text-muted-foreground">
                      {new Date(r.createdAt).toLocaleDateString("fa-IR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
