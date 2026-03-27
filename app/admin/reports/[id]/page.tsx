"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/edyen";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowRight,
  Building2,
  Calendar,
  Check,
  FileText,
  Mail,
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

type ValidatorAssignment = {
  id: string;
  validatorId: string;
  assignedAt: string;
  acceptedAt?: string | null;
  replacedAt?: string | null;
  reason: string;
  validator: { id: string; name: string; username: string };
};

type ReportDetail = {
  id: string;
  title?: string | null;
  description: string;
  status: string;
  rejectionReason?: string | null;
  assignedAt?: string | null;
  reviewedAt?: string | null;
  reviews?: ReportReview[];
  validatorAssignments?: ValidatorAssignment[];
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

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleDateString("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type StepStatus = "completed" | "current" | "pending";

function getValidatorReviewStatus(assignment: ValidatorAssignment, reviews: ReportReview[]) {
  const review = reviews.find((r) => r.reviewerId === assignment.validator.id);
  if (review) {
    return {
      status: review.action as "accepted" | "rejected",
      date: review.createdAt,
    };
  }
  if (assignment.replacedAt) {
    return { status: "replaced" as const, date: assignment.replacedAt };
  }
  if (assignment.acceptedAt) {
    return { status: "reviewing" as const, date: null };
  }
  return { status: "waiting" as const, date: null };
}

function ReportTimeline({ report }: { report: ReportDetail }) {
  const isFinal = report.status === "accepted" || report.status === "rejected";
  const assignments = report.validatorAssignments ?? [];
  const reviews = report.reviews ?? [];

  const steps: {
    label: string;
    date?: string | null;
    status: StepStatus;
  }[] = [
    {
      label: "ثبت",
      date: report.createdAt,
      status: "completed",
    },
    {
      label: "بررسی و اعتبارسنجی",
      date: assignments.length > 0 ? (report.assignedAt ?? assignments[0]?.assignedAt) : null,
      status: isFinal ? "completed" : "current",
    },
    {
      label: "تایید و نتایج",
      date: report.reviewedAt,
      status: isFinal ? "completed" : "pending",
    },
  ];

  return (
    <Card className="md:col-span-2">
      <CardHeader>
        <CardTitle>تایم‌لاین گزارش</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 3-step horizontal timeline */}
        <div className="flex w-full">
          {steps.map((step, idx) => (
            <React.Fragment key={step.label}>
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-all ${
                    step.status === "completed"
                      ? "bg-green-500 text-white"
                      : step.status === "current"
                        ? "bg-primary text-primary-foreground ring-primary/20 ring-4"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {step.status === "completed" ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>
                <p
                  className={`mt-2 text-center text-sm font-medium ${
                    step.status === "pending" ? "text-muted-foreground" : "text-foreground"
                  }`}
                >
                  {step.label}
                </p>
                <p className="text-muted-foreground mt-1 text-center text-xs">
                  {step.date ? formatDateTime(step.date) : "—"}
                </p>
              </div>
              {idx < steps.length - 1 && (
                <div className="flex flex-1 items-start pt-5">
                  <div
                    className={`h-0.5 w-full ${
                      steps[idx + 1]?.status !== "pending" ? "bg-green-500" : "bg-muted"
                    }`}
                  />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Validators table */}
        {assignments.length > 0 && (
          <div>
            <h3 className="mb-3 text-sm font-semibold">اعتبارسنج‌ها</h3>
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>اعتبارسنج</TableHead>
                    <TableHead>تاریخ اساین</TableHead>
                    <TableHead>وضعیت</TableHead>
                    <TableHead>تاریخ قبول/رد</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignments.map((a) => {
                    const vs = getValidatorReviewStatus(a, reviews);
                    return (
                      <TableRow key={a.id}>
                        <TableCell>
                          <span className="font-medium">{a.validator.name}</span>
                          <span className="text-muted-foreground mr-1 text-xs">
                            ({a.validator.username})
                          </span>
                        </TableCell>
                        <TableCell className="text-sm">{formatDateTime(a.assignedAt)}</TableCell>
                        <TableCell>
                          {vs.status === "accepted" && <Badge variant="default">تایید شده</Badge>}
                          {vs.status === "rejected" && <Badge variant="destructive">رد شده</Badge>}
                          {vs.status === "reviewing" && (
                            <Badge variant="secondary">در حال بررسی</Badge>
                          )}
                          {vs.status === "waiting" && <Badge variant="outline">در انتظار</Badge>}
                          {vs.status === "replaced" && (
                            <Badge variant="outline" className="text-muted-foreground">
                              جایگزین شده
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {vs.date ? formatDateTime(vs.date) : "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
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
        {/* تایم‌لاین گزارش + جدول اعتبارسنج‌ها */}
        <ReportTimeline report={report} />

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
      </div>
    </div>
  );
}
