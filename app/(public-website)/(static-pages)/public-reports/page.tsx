"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { routes } from "@/lib/routes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toPersianNum } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Filter, FileSearch } from "lucide-react";

type PublicReportRow = {
  id: string;
  title: string | null;
  description: string;
  city: string | null;
  province: string | null;
  occurrenceDate: string | null;
  createdAt: string;
  category: { id: string; name: string } | null;
  person: { firstName: string; lastName: string };
};

type FiltersPayload = {
  categories: { id: string; name: string }[];
  cities: string[];
};

export default function PublicReportsPage() {
  const perPage = 12;
  const [rows, setRows] = useState<PublicReportRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [categories, setCategories] = useState<FiltersPayload["categories"]>([]);
  const [cities, setCities] = useState<string[]>([]);

  const [q, setQ] = useState("");
  const [city, setCity] = useState("all");
  const [categoryId, setCategoryId] = useState("all");
  const [occurrenceDateFrom, setOccurrenceDateFrom] = useState("");
  const [occurrenceDateTo, setOccurrenceDateTo] = useState("");

  const [appliedQ, setAppliedQ] = useState("");
  const [appliedCity, setAppliedCity] = useState("all");
  const [appliedCategoryId, setAppliedCategoryId] = useState("all");
  const [appliedOccurrenceDateFrom, setAppliedOccurrenceDateFrom] = useState("");
  const [appliedOccurrenceDateTo, setAppliedOccurrenceDateTo] = useState("");

  const activeFilters = useMemo(() => {
    return [
      appliedQ.trim() !== "",
      appliedCity !== "all",
      appliedCategoryId !== "all",
      appliedOccurrenceDateFrom !== "",
      appliedOccurrenceDateTo !== "",
    ].filter(Boolean).length;
  }, [
    appliedQ,
    appliedCity,
    appliedCategoryId,
    appliedOccurrenceDateFrom,
    appliedOccurrenceDateTo,
  ]);

  useEffect(() => {
    const loadFilters = async () => {
      const res = await fetch("/api/reports/public/filters");
      if (!res.ok) return;
      const data = (await res.json()) as FiltersPayload;
      setCategories(data.categories ?? []);
      setCities(data.cities ?? []);
    };
    void loadFilters();
  }, []);

  useEffect(() => {
    const loadPublicReports = async () => {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        perPage: String(perPage),
      });
      if (appliedQ.trim()) params.set("q", appliedQ.trim());
      if (appliedCity !== "all") params.set("city", appliedCity);
      if (appliedCategoryId !== "all") params.set("categoryId", appliedCategoryId);
      if (appliedOccurrenceDateFrom) params.set("occurrenceDateFrom", appliedOccurrenceDateFrom);
      if (appliedOccurrenceDateTo) params.set("occurrenceDateTo", appliedOccurrenceDateTo);

      const res = await fetch(`/api/reports/public?${params.toString()}`);
      if (!res.ok) {
        setRows([]);
        setTotal(0);
        setLoading(false);
        return;
      }

      const data = (await res.json()) as {
        data?: PublicReportRow[];
        total?: number;
      };
      setRows(data.data ?? []);
      setTotal(data.total ?? 0);
      setLoading(false);
    };
    void loadPublicReports();
  }, [
    page,
    appliedQ,
    appliedCity,
    appliedCategoryId,
    appliedOccurrenceDateFrom,
    appliedOccurrenceDateTo,
  ]);

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  const applyFilters = () => {
    setAppliedQ(q);
    setAppliedCity(city);
    setAppliedCategoryId(categoryId);
    setAppliedOccurrenceDateFrom(occurrenceDateFrom);
    setAppliedOccurrenceDateTo(occurrenceDateTo);
    setPage(1);
  };

  const clearFilters = () => {
    setQ("");
    setCity("all");
    setCategoryId("all");
    setOccurrenceDateFrom("");
    setOccurrenceDateTo("");
    setAppliedQ("");
    setAppliedCity("all");
    setAppliedCategoryId("all");
    setAppliedOccurrenceDateFrom("");
    setAppliedOccurrenceDateTo("");
    setPage(1);
  };

  return (
    <div className="bg-background mx-auto w-full max-w-[1600px] px-4 py-6 md:px-6 lg:px-8 lg:py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black md:text-3xl">گزارش‌های عمومی</h1>
          <p className="text-muted-foreground mt-2 text-sm md:text-base">
            گزارش‌هایی که توسط تیم تایید و برای مشاهده عمومی منتشر شده‌اند.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={routes.home}>بازگشت به خانه</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Card className="h-fit lg:sticky lg:top-20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Filter className="h-4 w-4" />
              فیلترها
              {activeFilters > 0 ? (
                <Badge variant="secondary" className="mr-auto">
                  {toPersianNum(activeFilters)}
                </Badge>
              ) : null}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="public-q">جستجو در عنوان و متن</Label>
              <Input
                id="public-q"
                value={q}
                onChange={(event) => setQ(event.target.value)}
                placeholder="کلیدواژه..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="public-city">شهر</Label>
              <select
                id="public-city"
                value={city}
                onChange={(event) => setCity(event.target.value)}
                className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
              >
                <option value="all">همه شهرها</option>
                {cities.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="public-category">دسته‌بندی</Label>
              <select
                id="public-category"
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
                className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
              >
                <option value="all">همه دسته‌ها</option>
                {categories.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="space-y-2">
                <Label htmlFor="public-occurrence-from">تاریخ وقوع از</Label>
                <Input
                  id="public-occurrence-from"
                  type="date"
                  value={occurrenceDateFrom}
                  onChange={(event) => setOccurrenceDateFrom(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="public-occurrence-to">تا</Label>
                <Input
                  id="public-occurrence-to"
                  type="date"
                  value={occurrenceDateTo}
                  onChange={(event) => setOccurrenceDateTo(event.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="button" className="flex-1" onClick={applyFilters}>
                اعمال
              </Button>
              <Button type="button" variant="outline" className="flex-1" onClick={clearFilters}>
                پاک‌سازی
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          {loading ? (
            <Card>
              <CardContent className="py-12 text-center text-sm">در حال بارگذاری...</CardContent>
            </Card>
          ) : rows.length === 0 ? (
            <Card>
              <CardContent className="text-muted-foreground flex flex-col items-center gap-2 py-12 text-sm">
                <FileSearch className="h-8 w-8" />
                <p>گزارش عمومی مطابق فیلترها پیدا نشد.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {rows.map((report) => (
                <Link
                  key={report.id}
                  href={routes.publicReportDetail(report.id)}
                  className="block rounded-xl focus-visible:ring-2 focus-visible:outline-none"
                >
                  <Card className="hover:bg-muted/30 transition-colors">
                    <CardContent className="space-y-3 pt-5">
                      <div className="flex flex-wrap items-center gap-2">
                        {report.category ? (
                          <Badge variant="secondary">{report.category.name}</Badge>
                        ) : null}
                        {report.city ? <Badge variant="outline">{report.city}</Badge> : null}
                      </div>
                      <h2 className="text-base font-bold md:text-lg">
                        {report.title?.trim() || "گزارش عمومی تاییدشده"}
                      </h2>
                      <p className="text-muted-foreground text-sm leading-7">
                        {report.description.length > 420
                          ? `${report.description.slice(0, 420)}...`
                          : report.description}
                      </p>
                      <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                        <span>
                          فرد گزارش‌شده: {report.person.firstName} {report.person.lastName}
                        </span>
                        <span>
                          تاریخ انتشار: {new Date(report.createdAt).toLocaleDateString("fa-IR")}
                        </span>
                        {report.occurrenceDate ? (
                          <span>
                            تاریخ وقوع:{" "}
                            {new Date(report.occurrenceDate).toLocaleDateString("fa-IR")}
                          </span>
                        ) : null}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}

              {totalPages > 1 ? (
                <div className="mt-2 flex items-center justify-between gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={page <= 1}
                    onClick={() => setPage((prev) => prev - 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                    قبلی
                  </Button>
                  <span className="text-muted-foreground text-sm">
                    صفحه {toPersianNum(page)} از {toPersianNum(totalPages)}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={page >= totalPages}
                    onClick={() => setPage((prev) => prev + 1)}
                  >
                    بعدی
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
