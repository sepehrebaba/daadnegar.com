"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/app-context";
import { routes } from "@/lib/routes";
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
import { ReportWizardProgress } from "@/components/report-wizard-progress";

export function ReportOccurrenceScreen() {
  const router = useRouter();
  const { updateReport, state } = useApp();
  const [frequency, setFrequency] = useState<OccurrenceFrequency | "">(
    (state.currentReport?.occurrenceFrequency as OccurrenceFrequency) ?? "",
  );
  const [date, setDate] = useState(
    state.currentReport?.occurrenceDate
      ? new Date(state.currentReport.occurrenceDate).toISOString().split("T")[0]
      : "",
  );

  const isValid = frequency !== "" && date !== "";

  const handleNext = () => {
    if (isValid) {
      updateReport({
        occurrenceFrequency: frequency as OccurrenceFrequency,
        occurrenceDate: new Date(date),
      });
      router.push(routes.reportEvidence);
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
          <div className="space-y-2">
            <Label htmlFor="frequency">
              این اتفاق چند بار رخ داده است؟ <span className="text-destructive">*</span>
            </Label>
            <Select value={frequency} onValueChange={(v) => setFrequency(v as OccurrenceFrequency)}>
              <SelectTrigger id="frequency">
                <SelectValue placeholder="انتخاب تکرار..." />
              </SelectTrigger>
              <SelectContent>
                {OCCURRENCE_FREQUENCIES.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
                onChange={(e) => setDate(e.target.value)}
                className="pr-10"
              />
            </div>
            <p className="text-muted-foreground text-xs">
              اگر تاریخ دقیق را نمی‌دانید، تاریخ تقریبی را وارد کنید
            </p>
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
          <ReportWizardProgress step={6} total={8} />
        </CardContent>
      </Card>
    </div>
  );
}
