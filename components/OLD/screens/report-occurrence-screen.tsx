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
import { ArrowRight, ArrowLeft, Clock, Calendar } from "lucide-react";
import { OCCURRENCE_FREQUENCIES, type OccurrenceFrequency } from "@/types";

export function ReportOccurrenceScreen() {
  const { navigate, goBack, updateReport, state } = useApp();
  const [frequency, setFrequency] = useState<OccurrenceFrequency | "">(
    (state.currentReport?.occurrenceFrequency as OccurrenceFrequency) || "",
  );
  const [date, setDate] = useState(
    state.currentReport?.occurrenceDate
      ? new Date(state.currentReport.occurrenceDate).toISOString().split("T")[0]
      : "",
  );

  const isValid = frequency !== "" && date !== "";

  const handleNext = () => {
    if (isValid) {
      console.log("[v0] Report occurrence set:", { frequency, date });
      updateReport({
        occurrenceFrequency: frequency as OccurrenceFrequency,
        occurrenceDate: new Date(date),
      });
      navigate("report-evidence");
    }
  };

  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
            <Clock className="text-primary h-8 w-8" />
          </div>
          <CardTitle className="text-2xl">زمان و تکرار وقوع</CardTitle>
          <CardDescription>زمان وقوع و تعداد دفعات را مشخص کنید</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* تکرار وقوع */}
          <div className="space-y-2">
            <Label htmlFor="frequency">
              این اتفاق چند بار رخ داده است؟ <span className="text-destructive">*</span>
            </Label>
            <Select
              value={frequency}
              onValueChange={(value) => {
                setFrequency(value as OccurrenceFrequency);
                console.log("[v0] Frequency changed to:", value);
              }}
            >
              <SelectTrigger id="frequency">
                <SelectValue placeholder="انتخاب تکرار..." />
              </SelectTrigger>
              <SelectContent>
                {OCCURRENCE_FREQUENCIES.map((freq) => (
                  <SelectItem key={freq.value} value={freq.value}>
                    {freq.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* تاریخ وقوع */}
          <div className="space-y-2">
            <Label htmlFor="date">
              تاریخ وقوع <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Calendar className="text-muted-foreground absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2" />
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  console.log("[v0] Date changed to:", e.target.value);
                }}
                className="pr-10"
              />
            </div>
            <p className="text-muted-foreground text-xs">
              اگر تاریخ دقیق را نمی‌دانید، تاریخ تقریبی را وارد کنید
            </p>
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
            <div className="bg-primary h-3 w-3 rounded-full" />
            <div className="bg-primary h-3 w-3 rounded-full" />
            <div className="bg-primary h-3 w-3 rounded-full" />
            <div className="bg-primary h-3 w-3 rounded-full" />
            <div className="bg-muted h-3 w-3 rounded-full" />
            <div className="bg-muted h-3 w-3 rounded-full" />
          </div>
          <p className="text-muted-foreground text-center text-sm">مرحله ۶ از ۸</p>
        </CardContent>
      </Card>
    </div>
  );
}
