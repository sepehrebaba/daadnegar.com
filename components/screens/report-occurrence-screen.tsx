"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useReport } from "@/context/report-context";
import { routes } from "@/lib/routes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowRight, ArrowLeft, Clock } from "lucide-react";
import { DatePicker } from "zaman";
import { OCCURRENCE_FREQUENCIES, type OccurrenceFrequency } from "@/types";
import { ReportWizardProgress } from "@/components/report-wizard-progress";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

export function ReportOccurrenceScreen() {
  const router = useRouter();
  const { updateReport, currentReport } = useReport();
  const { t } = useTranslation();
  const [frequency, setFrequency] = useState<OccurrenceFrequency | "">(
    (currentReport?.occurrenceFrequency as OccurrenceFrequency) ?? "",
  );
  const [date, setDate] = useState<Date | undefined>(
    currentReport?.occurrenceDate ? new Date(currentReport.occurrenceDate) : undefined,
  );

  const [hydrate, setHydrate] = useState(false);

  useEffect(() => {
    setHydrate(true);
  }, []);

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

  const handleDateChange = (e: { value: Date | number }) => {
    const d = typeof e.value === "number" ? new Date(e.value) : e.value;
    if (!d) return;
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (d.getTime() <= today.getTime()) {
      setDate(d);
    }
  };

  const frequencyLabels: Record<string, string> = {
    once: t("report.occurrence.frequencies.once"),
    few: t("report.occurrence.frequencies.few"),
    repeated: t("report.occurrence.frequencies.repeated"),
    ongoing: t("report.occurrence.frequencies.ongoing"),
  };

  return (
    <div className="bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
            <Clock className="text-primary h-8 w-8" />
          </div>
          <CardTitle className="text-2xl">{t("report.occurrence.title")}</CardTitle>
          <CardDescription>{t("report.occurrence.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label>
              {t("report.occurrence.frequencyLabel")} <span className="text-destructive">*</span>
            </Label>
            <RadioGroup
              value={frequency}
              onValueChange={(v) => setFrequency(v as OccurrenceFrequency)}
              className="grid grid-cols-2 gap-3"
              dir="rtl"
            >
              {OCCURRENCE_FREQUENCIES.map((f) => (
                <Label
                  htmlFor={`freq-${f.value}`}
                  key={f.value}
                  className={cn(
                    "border-border flex items-center gap-3 rounded-lg border p-3 transition-colors",
                    frequency === f.value
                      ? "border-primary bg-primary/5"
                      : "hover:border-primary/50 hover:bg-muted/50",
                  )}
                >
                  <RadioGroupItem value={f.value} id={`freq-${f.value}`} className="shrink-0" />
                  <div className="flex-1 cursor-pointer text-sm font-medium">
                    {frequencyLabels[f.value] ?? f.label}
                  </div>
                </Label>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label>
              {t("report.occurrence.dateLabel")} <span className="text-destructive">*</span>
            </Label>
            <DatePicker
              defaultValue={date}
              onChange={handleDateChange}
              locale="fa"
              direction="rtl"
              position="right"
              inputClass="border-input flex h-9 w-full items-center rounded-md border bg-transparent px-3 py-2 text-right text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <p className="text-muted-foreground text-xs">{t("report.occurrence.dateHint")}</p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => router.back()} className="flex-1">
              <ArrowRight className="ml-2 h-4 w-4" />
              {t("common.back")}
            </Button>
            <Button onClick={handleNext} disabled={!isValid} className="flex-1">
              {t("common.next")}
              <ArrowLeft className="ml-2 h-4 w-4" />
            </Button>
          </div>
          <ReportWizardProgress step={6} total={8} />
        </CardContent>
      </Card>
    </div>
  );
}
