"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { routes } from "@/lib/routes";
import { ArrowRight, Calendar, FileSearch, MapPin } from "lucide-react";

type PersonPublicData = {
  id: string;
  firstName: string;
  lastName: string;
  imageUrl: string | null;
  title: string | null;
};

type PersonReportRow = {
  id: string;
  title: string | null;
  description: string;
  city: string | null;
  province: string | null;
  occurrenceDate: string | null;
  createdAt: string;
  category: { id: string; name: string } | null;
};

type PersonReportsPayload = {
  person: PersonPublicData;
  reports: PersonReportRow[];
};

export default function PublicPersonReportsPage() {
  const params = useParams();
  const router = useRouter();
  const personId = params?.personId as string | undefined;

  const [data, setData] = useState<PersonReportsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!personId) return;
    const load = async () => {
      setLoading(true);
      const res = await fetch(`/api/reports/public/person/${personId}`);
      if (!res.ok) {
        setError("اطلاعات این فرد یا گزارش‌های عمومی او پیدا نشد.");
        setLoading(false);
        return;
      }
      const payload = (await res.json()) as PersonReportsPayload;
      setData(payload);
      setLoading(false);
    };
    void load();
  }, [personId]);

  const fullName = useMemo(() => {
    if (!data?.person) return "";
    return `${data.person.firstName} ${data.person.lastName}`.trim();
  }, [data]);

  if (!personId) return null;

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-8">
        <Card>
          <CardContent className="py-10 text-center text-sm">در حال بارگذاری...</CardContent>
        </Card>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-8">
        <Card>
          <CardContent className="space-y-4 py-10 text-center">
            <p className="text-destructive text-sm">{error ?? "اطلاعاتی یافت نشد."}</p>
            <Button asChild variant="outline">
              <Link href={routes.publicReports}>بازگشت به گزارش‌های عمومی</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 md:py-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          <ArrowRight className="h-4 w-4" />
          بازگشت
        </Button>
        <Button asChild variant="ghost">
          <Link href={routes.publicReports}>همه گزارش‌های عمومی</Link>
        </Button>
      </div>

      <Card className="mb-4">
        <CardContent className="flex items-center gap-3 py-5">
          <Avatar className="h-14 w-14">
            {data.person.imageUrl ? <AvatarImage src={data.person.imageUrl} /> : null}
            <AvatarFallback>{`${data.person.firstName[0] ?? ""}${data.person.lastName[0] ?? ""}`}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-xl font-black md:text-2xl">{fullName}</h1>
            <p className="text-muted-foreground text-sm">
              {data.person.title?.trim() || "عنوان ثبت نشده"}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>گزارش‌های ثبت‌شده برای این فرد ({data.reports.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.reports.length === 0 ? (
            <div className="text-muted-foreground flex flex-col items-center gap-2 py-10 text-sm">
              <FileSearch className="h-7 w-7" />
              گزارشی برای نمایش وجود ندارد.
            </div>
          ) : (
            data.reports.map((report) => (
              <Link
                key={report.id}
                href={routes.publicReportDetail(report.id)}
                className="hover:bg-muted/40 block rounded-lg border p-4 transition-colors"
              >
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  {report.category ? (
                    <Badge variant="secondary">{report.category.name}</Badge>
                  ) : null}
                  {(report.province || report.city) && (
                    <Badge variant="outline">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {[report.province, report.city].filter(Boolean).join("، ")}
                      </span>
                    </Badge>
                  )}
                </div>
                <h2 className="mb-1 text-base font-bold">
                  {report.title?.trim() || "گزارش عمومی تاییدشده"}
                </h2>
                <p className="text-muted-foreground line-clamp-3 text-sm leading-7">
                  {report.description}
                </p>
                <div className="text-muted-foreground mt-2 inline-flex items-center gap-1 text-xs">
                  <Calendar className="h-3.5 w-3.5" />
                  انتشار: {new Date(report.createdAt).toLocaleDateString("fa-IR")}
                  {report.occurrenceDate ? (
                    <>
                      <span className="mx-1">|</span>
                      وقوع: {new Date(report.occurrenceDate).toLocaleDateString("fa-IR")}
                    </>
                  ) : null}
                </div>
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
