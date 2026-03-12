"use client";

import { useState } from "react";
import { useApp } from "@/context/app-context";
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
import { REPORT_CATEGORIES, type ReportCategory } from "@/types";

export function ReportCategoryScreen() {
  const { navigate, goBack, updateReport, state } = useApp();
  const [category, setCategory] = useState<ReportCategory | "">(
    (state.currentReport?.category as ReportCategory) || "",
  );
  const [subcategory, setSubcategory] = useState(state.currentReport?.subcategory || "");

  const selectedCategoryData = REPORT_CATEGORIES.find((c) => c.value === category);

  const handleNext = () => {
    if (category && subcategory) {
      console.log("[v0] Report category selected:", { category, subcategory });
      updateReport({ category: category as ReportCategory, subcategory });
      navigate("report-basic-info");
    }
  };

  const isValid = category && subcategory;

  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
            <FolderTree className="text-primary h-8 w-8" />
          </div>
          <CardTitle className="text-2xl">دسته‌بندی گزارش</CardTitle>
          <CardDescription>لطفاً نوع فساد یا تخلف را انتخاب کنید</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* دسته‌بندی اصلی */}
          <div className="space-y-2">
            <Label htmlFor="category">
              دسته‌بندی اصلی <span className="text-destructive">*</span>
            </Label>
            <Select
              value={category}
              onValueChange={(value) => {
                setCategory(value as ReportCategory);
                setSubcategory(""); // Reset subcategory when category changes
                console.log("[v0] Category changed to:", value);
              }}
            >
              <SelectTrigger id="category" className="w-full text-right">
                <SelectValue placeholder="انتخاب دسته‌بندی..." />
              </SelectTrigger>
              <SelectContent align="end" className="text-right">
                {REPORT_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value} className="justify-end">
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* زیردسته */}
          {category && selectedCategoryData && (
            <div className="space-y-2">
              <Label htmlFor="subcategory">
                زیردسته <span className="text-destructive">*</span>
              </Label>
              <Select
                value={subcategory}
                onValueChange={(value) => {
                  setSubcategory(value);
                  console.log("[v0] Subcategory changed to:", value);
                }}
              >
                <SelectTrigger id="subcategory" className="w-full text-right">
                  <SelectValue placeholder="انتخاب زیردسته..." />
                </SelectTrigger>
                <SelectContent align="end" className="text-right">
                  {selectedCategoryData.subcategories.map((sub) => (
                    <SelectItem key={sub.value} value={sub.value} className="justify-end">
                      {sub.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* دکمه‌ها */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={goBack} className="flex-1">
              <ArrowRight className="ml-2 h-4 w-4" />
              بازگشت
            </Button>
            <Button onClick={handleNext} disabled={!isValid} className="flex-1">
              مرحله بعد
              <ArrowLeft className="mr-2 h-4 w-4" />
            </Button>
          </div>

          {/* نوار پیشرفت */}
          <div className="flex items-center justify-center gap-2 pt-2">
            <div className="bg-primary h-3 w-3 rounded-full" />
            <div className="bg-muted h-3 w-3 rounded-full" />
            <div className="bg-muted h-3 w-3 rounded-full" />
            <div className="bg-muted h-3 w-3 rounded-full" />
            <div className="bg-muted h-3 w-3 rounded-full" />
            <div className="bg-muted h-3 w-3 rounded-full" />
            <div className="bg-muted h-3 w-3 rounded-full" />
            <div className="bg-muted h-3 w-3 rounded-full" />
          </div>
          <p className="text-muted-foreground text-center text-sm">مرحله ۱ از ۸</p>
        </CardContent>
      </Card>
    </div>
  );
}
