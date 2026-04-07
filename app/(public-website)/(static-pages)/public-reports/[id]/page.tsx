"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { routes } from "@/lib/routes";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowRight,
  Building2,
  Calendar,
  ClipboardList,
  FolderTree,
  MapPin,
  Repeat,
  ShieldCheck,
  ChevronLeft,
} from "lucide-react";

type PublicReportDetail = {
  id: string;
  title: string | null;
  description: string;
  organizationType: string | null;
  organizationName: string | null;
  city: string | null;
  province: string | null;
  exactLocation: string | null;
  occurrenceFrequency: string | null;
  occurrenceDate: string | null;
  hasEvidence: boolean | null;
  evidenceTypes: string | null;
  evidenceDescription: string | null;
  status: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  category: { id: string; name: string } | null;
  subcategory: { id: string; name: string } | null;
  person: {
    id: string;
    firstName: string;
    lastName: string;
    title: string | null;
    imageUrl: string | null;
  };
};

function DetailRow({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | null | undefined;
  icon?: React.ElementType;
}) {
  return (
    <div className="grid grid-cols-1 gap-1 rounded-md border p-3 sm:grid-cols-[180px_minmax(0,1fr)]">
      <span className="text-muted-foreground inline-flex items-center gap-1.5 text-sm">
        {Icon ? <Icon className="h-4 w-4" /> : null}
        {label}
      </span>
      <span className="text-sm leading-7 whitespace-pre-wrap">{value?.trim() ? value : "—"}</span>
    </div>
  );
}

export default function PublicReportDetailPage() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string | undefined;

  const [report, setReport] = useState<PublicReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const loadReport = async () => {
      setLoading(true);
      const res = await fetch(`/api/reports/public/${id}`);
      if (!res.ok) {
        setError(t("publicReportDetail.notFound"));
        setLoading(false);
        return;
      }
      const data = (await res.json()) as PublicReportDetail;
      setReport(data);
      setLoading(false);
    };
    void loadReport();
  }, [id]);

  if (!id) {
    return null;
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-10">
        <Card>
          <CardContent className="py-10 text-center text-sm">{t("common.loading")}</CardContent>
        </Card>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-10">
        <Card>
          <CardContent className="space-y-4 py-10 text-center">
            <p className="text-destructive text-sm">
              {error ?? t("publicReportDetail.notFoundFallback")}
            </p>
            <Button asChild variant="outline">
              <Link href={routes.publicReports}>{t("publicReportDetail.allPublicReports")}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 md:py-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          <ArrowRight className="h-4 w-4" />
          {t("common.back")}
        </Button>
        <Button asChild variant="ghost">
          <Link href={routes.publicReports}>{t("publicReportDetail.allPublicReports")}</Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {report.category ? <Badge variant="secondary">{report.category.name}</Badge> : null}
            {report.subcategory ? <Badge variant="outline">{report.subcategory.name}</Badge> : null}
            <Badge variant="outline">
              {report.status === "accepted" ? t("publicReportDetail.approved") : report.status}
            </Badge>
            <Badge variant="outline">
              {report.isPublic ? t("common.public") : t("publicReportDetail.private")}
            </Badge>
          </div>
          <CardTitle className="text-xl font-black md:text-2xl">
            {report.title?.trim() || t("publicReportDetail.noTitle")}
          </CardTitle>
          <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {t("publicReportDetail.publishDate")}{" "}
              {new Date(report.createdAt).toLocaleDateString("fa-IR")}
            </span>
            {report.occurrenceDate ? (
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {t("publicReportDetail.occurrenceDate")}{" "}
                {new Date(report.occurrenceDate).toLocaleDateString("fa-IR")}
              </span>
            ) : null}
            {(report.city || report.province) && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {[report.province, report.city].filter(Boolean).join(t("common.listSeparator"))}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Link
            href={routes.publicReportsByPerson(report.person.id)}
            className="hover:bg-muted/40 block rounded-lg border p-4 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                {report.person.imageUrl ? <AvatarImage src={report.person.imageUrl} /> : null}
                <AvatarFallback>
                  {`${report.person.firstName[0] ?? ""}${report.person.lastName[0] ?? ""}`}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="font-bold">
                  {report.person.firstName} {report.person.lastName}
                </p>
                <p className="text-muted-foreground text-sm">
                  {report.person.title?.trim() || t("publicReportDetail.personNoTitle")}
                </p>
              </div>
              <span className="text-primary inline-flex items-center gap-1 text-sm font-medium">
                {t("publicReportDetail.viewProfile")}
                <ChevronLeft className="h-4 w-4" />
              </span>
            </div>
          </Link>

          <div className="rounded-lg border p-4">
            <h2 className="mb-2 inline-flex items-center gap-2 font-bold">
              <ClipboardList className="h-4 w-4" />
              {t("publicReportDetail.reportDescription")}
            </h2>
            <p className="text-muted-foreground leading-8 whitespace-pre-wrap">
              {report.description}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border p-4">
              <h2 className="mb-3 inline-flex items-center gap-2 font-bold">
                <MapPin className="h-4 w-4" />
                {t("publicReportDetail.locationAndTime")}
              </h2>
              <div className="space-y-2">
                <DetailRow
                  label={t("publicReportDetail.province")}
                  value={report.province}
                  icon={MapPin}
                />
                <DetailRow label={t("publicReportDetail.city")} value={report.city} icon={MapPin} />
                <DetailRow
                  label={t("publicReportDetail.exactLocation")}
                  value={report.exactLocation}
                  icon={MapPin}
                />
                <DetailRow
                  label={t("publicReportDetail.occurrenceDateLabel")}
                  value={
                    report.occurrenceDate
                      ? new Date(report.occurrenceDate).toLocaleDateString("fa-IR")
                      : null
                  }
                  icon={Calendar}
                />
                <DetailRow
                  label={t("publicReportDetail.occurrenceFrequency")}
                  value={report.occurrenceFrequency}
                  icon={Repeat}
                />
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <h2 className="mb-3 inline-flex items-center gap-2 font-bold">
                <Building2 className="h-4 w-4" />
                {t("publicReportDetail.organizationInfo")}
              </h2>
              <div className="space-y-2">
                <DetailRow
                  label={t("publicReportDetail.orgType")}
                  value={report.organizationType}
                  icon={Building2}
                />
                <DetailRow
                  label={t("publicReportDetail.orgName")}
                  value={report.organizationName}
                  icon={Building2}
                />
              </div>
            </div>

            <div className="rounded-lg border p-4 md:col-span-2">
              <h2 className="mb-3 inline-flex items-center gap-2 font-bold">
                <ShieldCheck className="h-4 w-4" />
                {t("publicReportDetail.evidence")}
              </h2>
              <div className="space-y-2">
                <DetailRow
                  label={t("publicReportDetail.hasEvidence")}
                  value={
                    report.hasEvidence == null
                      ? null
                      : report.hasEvidence
                        ? t("common.yes")
                        : t("common.no")
                  }
                  icon={ShieldCheck}
                />
                <DetailRow
                  label={t("publicReportDetail.evidenceType")}
                  value={report.evidenceTypes}
                  icon={FolderTree}
                />
                <DetailRow
                  label={t("publicReportDetail.evidenceDesc")}
                  value={report.evidenceDescription}
                  icon={ClipboardList}
                />
              </div>
            </div>

            <div className="rounded-lg border p-4 md:col-span-2">
              <h2 className="mb-3 inline-flex items-center gap-2 font-bold">
                <Calendar className="h-4 w-4" />
                {t("publicReportDetail.submissionTiming")}
              </h2>
              <div className="space-y-2">
                <DetailRow
                  label={t("publicReportDetail.publishDateLabel")}
                  value={new Date(report.createdAt).toLocaleDateString("fa-IR")}
                  icon={Calendar}
                />
                <DetailRow
                  label={t("publicReportDetail.lastUpdated")}
                  value={new Date(report.updatedAt).toLocaleDateString("fa-IR")}
                  icon={Calendar}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
