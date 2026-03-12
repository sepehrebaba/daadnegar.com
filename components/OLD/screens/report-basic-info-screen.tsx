"use client";

import { useState } from "react";
import { useApp } from "@/context/app-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, ArrowLeft, FileText, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function ReportBasicInfoScreen() {
  const { navigate, goBack, updateReport, state } = useApp();
  const [title, setTitle] = useState(state.currentReport?.title || "");
  const [description, setDescription] = useState(state.currentReport?.description || "");

  const titleLength = title.length;
  const descriptionLength = description.length;

  const isTitleValid = titleLength > 0 && titleLength <= 120;
  const isDescriptionValid = descriptionLength >= 120 && descriptionLength <= 10000;
  const isValid = isTitleValid && isDescriptionValid;

  const handleNext = () => {
    if (isValid) {
      console.log("[v0] Report basic info set:", { title, descriptionLength });
      updateReport({ title, description });
      navigate("report-organization");
    }
  };

  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
            <FileText className="text-primary h-8 w-8" />
          </div>
          <CardTitle className="text-2xl">اطلاعات پایه گزارش</CardTitle>
          <CardDescription>عنوان و شرح کامل گزارش را وارد کنید</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* عنوان */}
          <div className="space-y-2">
            <Label htmlFor="title">
              عنوان گزارش <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: درخواست رشوه برای صدور مجوز کسب‌وکار در تهران"
              maxLength={120}
              dir="rtl"
            />
            <div className="text-muted-foreground flex justify-between text-xs">
              <span>{titleLength}/120 کاراکتر</span>
              {titleLength > 120 && <span className="text-destructive">حداکثر ۱۲۰ کاراکتر</span>}
            </div>
          </div>

          {/* هشدار */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              در عنوان نباید نام اشخاص یا اطلاعات حساس مانند کد ملی ذکر شود.
            </AlertDescription>
          </Alert>

          {/* شرح کامل */}
          <div className="space-y-2">
            <Label htmlFor="description">
              شرح کامل گزارش <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="لطفاً توضیح دهید:
- چه اتفاقی افتاده است
- چه شخص یا نهادی درگیر بوده است
- فساد چگونه رخ داده است
- پیامد یا نتیجه این اتفاق چه بوده است"
              rows={8}
              maxLength={10000}
              dir="rtl"
              className="resize-none"
            />
            <div className="text-muted-foreground flex justify-between text-xs">
              <span>{descriptionLength}/10000 کاراکتر</span>
              {descriptionLength < 120 && (
                <span className="text-amber-600">
                  حداقل ۱۲۰ کاراکتر ({120 - descriptionLength} کاراکتر دیگر)
                </span>
              )}
            </div>
          </div>

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
            <div className="bg-primary h-3 w-3 rounded-full" />
            <div className="bg-muted h-3 w-3 rounded-full" />
            <div className="bg-muted h-3 w-3 rounded-full" />
            <div className="bg-muted h-3 w-3 rounded-full" />
            <div className="bg-muted h-3 w-3 rounded-full" />
            <div className="bg-muted h-3 w-3 rounded-full" />
            <div className="bg-muted h-3 w-3 rounded-full" />
          </div>
          <p className="text-muted-foreground text-center text-sm">مرحله ۲ از ۸</p>
        </CardContent>
      </Card>
    </div>
  );
}
