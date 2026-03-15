"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/app-context";
import { routes } from "@/lib/routes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ArrowRight, ArrowLeft, Clock, Calendar as CalendarIcon } from "lucide-react";
import { DayPicker } from "react-day-picker/persian";
import { faIR } from "react-day-picker/locale";
import { OCCURRENCE_FREQUENCIES, type OccurrenceFrequency } from "@/types";
import { ReportWizardProgress } from "@/components/report-wizard-progress";
import { cn } from "@/lib/utils";

export function ReportOccurrenceScreen() {
  const router = useRouter();
  const { updateReport, state } = useApp();
  const [frequency, setFrequency] = useState<OccurrenceFrequency | "">(
    (state.currentReport?.occurrenceFrequency as OccurrenceFrequency) ?? "",
  );
  const [date, setDate] = useState<Date | undefined>(
    state.currentReport?.occurrenceDate ? new Date(state.currentReport.occurrenceDate) : undefined,
  );
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);

  const isValid = frequency !== "" && date !== undefined;

  const handleNext = () => {
    if (isValid && date) {
      updateReport({
        occurrenceFrequency: frequency as OccurrenceFrequency,
        occurrenceDate: date,
      });
      router.push(routes.reportEvidence);
    }
  };

  const dateDisplay = date
    ? date.toLocaleDateString("fa-IR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "انتخاب تاریخ";

  return (
    <div className="bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
            <Clock className="text-primary h-8 w-8" />
          </div>
          <CardTitle className="text-2xl">زمان و تکرار وقوع</CardTitle>
          <CardDescription>زمان وقوع و تعداد دفعات را مشخص کنید</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label>
              این اتفاق چند بار رخ داده است؟ <span className="text-destructive">*</span>
            </Label>
            <RadioGroup
              value={frequency}
              onValueChange={(v) => setFrequency(v as OccurrenceFrequency)}
              className="grid grid-cols-2 gap-3"
            >
              {OCCURRENCE_FREQUENCIES.map((f) => (
                <div
                  key={f.value}
                  className={cn(
                    "border-border flex items-center gap-3 rounded-lg border p-3 transition-colors",
                    frequency === f.value
                      ? "border-primary bg-primary/5"
                      : "hover:border-primary/50 hover:bg-muted/50",
                  )}
                >
                  <RadioGroupItem value={f.value} id={`freq-${f.value}`} className="shrink-0" />
                  <Label
                    htmlFor={`freq-${f.value}`}
                    className="flex-1 cursor-pointer text-sm font-medium"
                  >
                    {f.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label>
              تاریخ وقوع <span className="text-destructive">*</span>
            </Label>
            <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start pr-10 text-right font-normal",
                    !date && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="text-muted-foreground ml-2 h-4 w-4 shrink-0" />
                  {dateDisplay}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <DayPicker
                  mode="single"
                  locale={faIR}
                  selected={date}
                  onSelect={(d) => {
                    setDate(d);
                    if (d) setDatePopoverOpen(false);
                  }}
                  disabled={{ after: new Date() }}
                  dir="rtl"
                  className="rounded-md border-0"
                />
              </PopoverContent>
            </Popover>
            <p className="text-muted-foreground text-xs">
              اگر تاریخ دقیق را نمی‌دانید، تاریخ تقریبی را وارد کنید (فقط تاریخ‌های گذشته و امروز)
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => router.back()} className="flex-1">
              <ArrowRight className="ml-2 h-4 w-4" />
              بازگشت
            </Button>
            <Button onClick={handleNext} disabled={!isValid} className="flex-1">
              مرحله بعد
              <ArrowLeft className="ml-2 h-4 w-4" />
            </Button>
          </div>
          <ReportWizardProgress step={6} total={8} />
        </CardContent>
      </Card>
    </div>
  );
}
