"use client";

import { useState } from "react";
import { useApp } from "@/context/app-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowRight, ArrowLeft, FileCheck, Upload, X } from "lucide-react";
import { EVIDENCE_TYPES, type EvidenceType } from "@/types";

export function ReportEvidenceScreen() {
  const { navigate, goBack, updateReport, state } = useApp();
  const [hasEvidence, setHasEvidence] = useState<"yes" | "no" | "">(
    state.currentReport?.hasEvidence === true
      ? "yes"
      : state.currentReport?.hasEvidence === false
        ? "no"
        : "",
  );
  const [evidenceTypes, setEvidenceTypes] = useState<EvidenceType[]>(
    state.currentReport?.evidenceTypes || [],
  );
  const [evidenceFiles, setEvidenceFiles] = useState<string[]>(
    state.currentReport?.evidenceFiles || [],
  );
  const [evidenceDescription, setEvidenceDescription] = useState(
    state.currentReport?.evidenceDescription || "",
  );

  const isValid = hasEvidence === "no" || (hasEvidence === "yes" && evidenceTypes.length > 0);

  const handleEvidenceTypeToggle = (type: EvidenceType) => {
    setEvidenceTypes((prev) => {
      if (prev.includes(type)) {
        return prev.filter((t) => t !== type);
      } else {
        return [...prev, type];
      }
    });
    console.log("[v0] Evidence type toggled:", type);
  };

  const handleFileUpload = () => {
    // TODO: Implement file upload
    const mockFileName = `evidence_${Date.now()}.pdf`;
    setEvidenceFiles((prev) => [...prev, mockFileName]);
    console.log("[v0] File uploaded (mock):", mockFileName);
  };

  const handleRemoveFile = (fileName: string) => {
    setEvidenceFiles((prev) => prev.filter((f) => f !== fileName));
    console.log("[v0] File removed:", fileName);
  };

  const handleNext = () => {
    if (isValid) {
      console.log("[v0] Report evidence set:", {
        hasEvidence,
        evidenceTypes,
        evidenceFiles,
        evidenceDescription,
      });
      updateReport({
        hasEvidence: hasEvidence === "yes",
        evidenceTypes: hasEvidence === "yes" ? evidenceTypes : undefined,
        evidenceFiles: hasEvidence === "yes" ? evidenceFiles : undefined,
        evidenceDescription:
          hasEvidence === "yes" && evidenceDescription ? evidenceDescription : undefined,
      });
      navigate("report-contact");
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
          {/* آیا مدرک دارید */}
          <RadioGroup
            value={hasEvidence}
            onValueChange={(value) => {
              setHasEvidence(value as "yes" | "no");
              if (value === "no") {
                setEvidenceTypes([]);
                setEvidenceFiles([]);
                setEvidenceDescription("");
              }
              console.log("[v0] Has evidence changed to:", value);
            }}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2 space-x-reverse">
              <RadioGroupItem value="yes" id="evidence-yes" />
              <Label htmlFor="evidence-yes" className="cursor-pointer">
                بله
              </Label>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <RadioGroupItem value="no" id="evidence-no" />
              <Label htmlFor="evidence-no" className="cursor-pointer">
                خیر
              </Label>
            </div>
          </RadioGroup>

          {hasEvidence === "yes" && (
            <>
              {/* نوع مدرک */}
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

              {/* بارگذاری فایل */}
              <div className="space-y-3">
                <Label>
                  بارگذاری مدارک <span className="text-muted-foreground">(اختیاری)</span>
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleFileUpload}
                  className="w-full"
                >
                  <Upload className="ml-2 h-4 w-4" />
                  انتخاب فایل
                </Button>

                {/* لیست فایل‌های آپلود شده */}
                {evidenceFiles.length > 0 && (
                  <div className="space-y-2">
                    {evidenceFiles.map((file) => (
                      <div
                        key={file}
                        className="bg-muted flex items-center justify-between rounded-lg p-2"
                      >
                        <span className="truncate text-sm">{file}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveFile(file)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* توضیحات مدارک */}
              <div className="space-y-2">
                <Label htmlFor="evidence-desc">
                  توضیحات درباره مدارک <span className="text-muted-foreground">(اختیاری)</span>
                </Label>
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
            <div className="bg-primary h-3 w-3 rounded-full" />
            <div className="bg-muted h-3 w-3 rounded-full" />
          </div>
          <p className="text-muted-foreground text-center text-sm">مرحله ۷ از ۸</p>
        </CardContent>
      </Card>
    </div>
  );
}
