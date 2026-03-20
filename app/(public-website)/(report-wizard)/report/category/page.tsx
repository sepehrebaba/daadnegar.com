"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/app-context";
import { routes } from "@/lib/routes";
import { api } from "@/lib/edyen";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowRight, ArrowLeft, FolderTree } from "lucide-react";
import { ReportWizardProgress } from "@/components/report-wizard-progress";

type CategoryWithChildren = {
  id: string;
  name: string;
  slug: string;
  children: { id: string; name: string; slug: string }[];
};

export default function ReportCategoryPage() {
  const router = useRouter();
  const { updateReport, state, startReport } = useApp();
  const [categories, setCategories] = useState<CategoryWithChildren[]>([]);
  const [categoryId, setCategoryId] = useState<string>(state.currentReport?.categoryId ?? "");
  const [subcategoryId, setSubcategoryId] = useState<string>(
    state.currentReport?.subcategoryId ?? "",
  );

  useEffect(() => {
    startReport();
  }, [startReport]);

  useEffect(() => {
    api.constants.categories
      .get()
      .then(({ data }) => setCategories((data as CategoryWithChildren[]) ?? []));
  }, []);

  const selectedCategory = categories.find((c) => c.id === categoryId);

  const handleNext = () => {
    if (categoryId && subcategoryId) {
      updateReport({ categoryId, subcategoryId });
      router.push(routes.reportBasicInfo);
    }
  };

  const isValid = !!categoryId && !!subcategoryId;

  return (
    <div className="bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
            <FolderTree className="text-primary h-8 w-8" />
          </div>
          <CardTitle className="text-2xl">دسته‌بندی گزارش</CardTitle>
          <CardDescription>لطفاً نوع فساد یا تخلف را انتخاب کنید</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="category">دسته‌بندی اصلی *</Label>
            <Select
              value={categoryId}
              onValueChange={(v) => {
                setCategoryId(v);
                setSubcategoryId("");
              }}
            >
              <SelectTrigger id="category" className="w-full">
                <SelectValue placeholder="انتخاب دسته‌بندی..." />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subcategory">زیردسته *</Label>
            <Select
              value={subcategoryId}
              onValueChange={setSubcategoryId}
              disabled={!selectedCategory || selectedCategory.children.length === 0}
            >
              <SelectTrigger id="subcategory" className="w-full">
                <SelectValue placeholder="انتخاب زیردسته..." />
              </SelectTrigger>
              <SelectContent>
                {selectedCategory?.children?.map((sub) => (
                  <SelectItem key={sub.id} value={sub.id}>
                    {sub.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => router.back()} className="flex-1">
              <ArrowRight className="ml-2 h-4 w-4" />
              بازگشت
            </Button>
            <Button onClick={handleNext} disabled={!isValid} className="flex-1">
              مرحله بعد
              <ArrowLeft className="mr-2 h-4 w-4" />
            </Button>
          </div>

          <ReportWizardProgress step={1} total={8} />
        </CardContent>
      </Card>
    </div>
  );
}
