"use client";

import { useState } from "react";
import { useApp } from "@/context/app-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowRight, ArrowLeft, MapPin, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { IRAN_PROVINCES } from "@/types";

export function ReportLocationScreen() {
  const { navigate, goBack, updateReport, state } = useApp();
  const [province, setProvince] = useState(state.currentReport?.province || "");
  const [city, setCity] = useState(state.currentReport?.city || "");
  const [exactLocation, setExactLocation] = useState(state.currentReport?.exactLocation || "");

  const isValid = province !== "";

  const handleNext = () => {
    if (isValid) {
      console.log("[v0] Report location set:", { province, city, exactLocation });
      updateReport({
        province,
        city: city || undefined,
        exactLocation: exactLocation || undefined,
      });
      navigate("report-occurrence");
    }
  };

  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
            <MapPin className="text-primary h-8 w-8" />
          </div>
          <CardTitle className="text-2xl">محل وقوع</CardTitle>
          <CardDescription>محل وقوع این اتفاق را مشخص کنید</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* استان */}
          <div className="space-y-2">
            <Label htmlFor="province">
              استان <span className="text-destructive">*</span>
            </Label>
            <Select
              value={province}
              onValueChange={(value) => {
                setProvince(value);
                console.log("[v0] Province changed to:", value);
              }}
            >
              <SelectTrigger id="province" className="w-full text-right">
                <SelectValue placeholder="انتخاب استان..." />
              </SelectTrigger>
              <SelectContent align="end" className="max-h-60 text-right">
                {IRAN_PROVINCES.map((prov) => (
                  <SelectItem key={prov} value={prov} className="justify-end">
                    {prov}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* شهر */}
          <div className="space-y-2">
            <Label htmlFor="city">
              شهر <span className="text-muted-foreground">(اختیاری)</span>
            </Label>
            <Input
              id="city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="نام شهر..."
              dir="rtl"
            />
          </div>

          {/* محل دقیق */}
          <div className="space-y-2">
            <Label htmlFor="exact-location">
              محل دقیق <span className="text-muted-foreground">(اختیاری)</span>
            </Label>
            <Input
              id="exact-location"
              value={exactLocation}
              onChange={(e) => setExactLocation(e.target.value)}
              placeholder="مثال: ساختمان مرکزی، طبقه سوم"
              dir="rtl"
            />
          </div>

          {/* هشدار */}
          <Alert variant="default" className="border-amber-200 bg-amber-50">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              از وارد کردن آدرس منزل یا اطلاعات شخصی خودداری کنید.
            </AlertDescription>
          </Alert>

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
            <div className="bg-primary h-3 w-3 rounded-full" />
            <div className="bg-primary h-3 w-3 rounded-full" />
            <div className="bg-primary h-3 w-3 rounded-full" />
            <div className="bg-muted h-3 w-3 rounded-full" />
            <div className="bg-muted h-3 w-3 rounded-full" />
            <div className="bg-muted h-3 w-3 rounded-full" />
          </div>
          <p className="text-muted-foreground text-center text-sm">مرحله ۵ از ۸</p>
        </CardContent>
      </Card>
    </div>
  );
}
