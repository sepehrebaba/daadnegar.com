"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/app-context";
import { routes } from "@/lib/routes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowRight, ArrowLeft, FileCheck, Upload, X, Check } from "lucide-react";
import { EVIDENCE_TYPES, type EvidenceType } from "@/types";
import { ReportWizardProgress } from "@/components/report-wizard-progress";

export function ReportEvidenceScreen() {
  const router = useRouter();
  const { updateReport, state } = useApp();
  const [hasEvidence, setHasEvidence] = useState<"yes" | "no" | "">(
    state.currentReport?.hasEvidence === true
      ? "yes"
      : state.currentReport?.hasEvidence === false
        ? "no"
        : "",
  );
  const [evidenceTypes, setEvidenceTypes] = useState<EvidenceType[]>(
    state.currentReport?.evidenceTypes ?? [],
  );
  const [evidenceFiles, setEvidenceFiles] = useState<{ name: string; url: string }[]>(
    (state.currentReport?.documents ?? []).map((d, i) =>
      typeof d === "string"
        ? { name: `doc-${i}`, url: d }
        : {
            name: (d as { name?: string }).name ?? `doc-${i}`,
            url: (d as { url?: string }).url ?? "",
          },
    ),
  );
  const [evidenceDescription, setEvidenceDescription] = useState(
    state.currentReport?.evidenceDescription ?? "",
  );

  const isValid = hasEvidence === "no" || (hasEvidence === "yes" && evidenceTypes.length > 0);

  const handleEvidenceTypeToggle = (type: EvidenceType) => {
    setEvidenceTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file) => {
        const url = URL.createObjectURL(file);
        setEvidenceFiles((prev) => [...prev, { name: file.name, url }]);
      });
    }
  };

  const handleRemoveFile = (idx: number) => {
    setEvidenceFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleNext = () => {
    if (isValid) {
      updateReport({
        hasEvidence: hasEvidence === "yes",
        evidenceTypes: hasEvidence === "yes" ? evidenceTypes : undefined,
        evidenceDescription:
          hasEvidence === "yes" && evidenceDescription ? evidenceDescription : undefined,
        documents: hasEvidence === "yes" ? evidenceFiles.map((f) => f.url) : [],
      });
      router.push(routes.reportContact);
    }
  };

  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
            <FileCheck className="text-primary h-8 w-8" />
          </div>
          <CardTitle className="text-2xl">مدارک و شواهد</CardTitle>
          <CardDescription>آیا مدرکی برای این گزارش دارید؟</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setHasEvidence("yes")}
              className={`relative flex flex-col items-center gap-3 rounded-xl border-2 p-4 transition-all duration-200 ${
                hasEvidence === "yes"
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border hover:border-primary/50 hover:bg-muted/50"
              }`}
            >
              {hasEvidence === "yes" && (
                <div className="bg-primary absolute top-2 left-2 flex h-5 w-5 items-center justify-center rounded-full">
                  <Check className="text-primary-foreground h-3 w-3" />
                </div>
              )}
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-full ${
                  hasEvidence === "yes" ? "bg-primary/20" : "bg-muted"
                }`}
              >
                <Check
                  className={`h-6 w-6 ${hasEvidence === "yes" ? "text-primary" : "text-muted-foreground"}`}
                />
              </div>
              <span
                className={`font-medium ${hasEvidence === "yes" ? "text-primary" : "text-foreground"}`}
              >
                بله
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setHasEvidence("no");
                setEvidenceTypes([]);
                setEvidenceFiles([]);
                setEvidenceDescription("");
              }}
              className={`relative flex flex-col items-center gap-3 rounded-xl border-2 p-4 transition-all duration-200 ${
                hasEvidence === "no"
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border hover:border-primary/50 hover:bg-muted/50"
              }`}
            >
              {hasEvidence === "no" && (
                <div className="bg-primary absolute top-2 left-2 flex h-5 w-5 items-center justify-center rounded-full">
                  <Check className="text-primary-foreground h-3 w-3" />
                </div>
              )}
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-full ${
                  hasEvidence === "no" ? "bg-primary/20" : "bg-muted"
                }`}
              >
                <X
                  className={`h-6 w-6 ${hasEvidence === "no" ? "text-primary" : "text-muted-foreground"}`}
                />
              </div>
              <span
                className={`font-medium ${hasEvidence === "no" ? "text-primary" : "text-foreground"}`}
              >
                خیر
              </span>
            </button>
          </div>

          {hasEvidence === "yes" && (
            <>
              <div className="space-y-3">
                <Label>
                  نوع مدرک <span className="text-destructive">*</span>
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {EVIDENCE_TYPES.map((type) => (
                    <div key={type.value} className="flex items-center space-x-2 space-x-reverse">
                      <Checkbox
                        id={type.value}
                        checked={evidenceTypes.includes(type.value)}
                        onCheckedChange={() => handleEvidenceTypeToggle(type.value)}
                      />
                      <Label htmlFor={type.value} className="cursor-pointer text-sm">
                        {type.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label>بارگذاری مدارک (اختیاری)</Label>
                <Button type="button" variant="outline" className="w-full" asChild>
                  <label>
                    <Upload className="ml-2 h-4 w-4" />
                    انتخاب فایل
                    <input type="file" multiple onChange={handleFileUpload} className="hidden" />
                  </label>
                </Button>
                {evidenceFiles.length > 0 && (
                  <div className="space-y-2">
                    {evidenceFiles.map((file, idx) => (
                      <div
                        key={idx}
                        className="bg-muted flex items-center justify-between rounded-lg p-2"
                      >
                        <span className="truncate text-sm">{file.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveFile(idx)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="evidence-desc">توضیحات درباره مدارک (اختیاری)</Label>
                <Textarea
                  id="evidence-desc"
                  value={evidenceDescription}
                  onChange={(e) => setEvidenceDescription(e.target.value)}
                  placeholder="توضیحات بیشتر درباره مدارک..."
                  rows={3}
                  dir="rtl"
                />
              </div>
            </>
          )}

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
          <ReportWizardProgress step={7} total={8} />
        </CardContent>
      </Card>
    </div>
  );
}
