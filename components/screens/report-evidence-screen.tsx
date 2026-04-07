"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useReport } from "@/context/report-context";
import { routes } from "@/lib/routes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  FileCheck,
  Info,
  Loader2,
  Upload,
  X,
  Check,
  FileText,
  Image,
  Video,
  Mic,
  Users,
} from "lucide-react";
import { uploadReportFile } from "@/lib/edyen";
import { EVIDENCE_TYPES, type EvidenceType } from "@/types";
import { ReportWizardProgress } from "@/components/report-wizard-progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useTranslation } from "react-i18next";

export function ReportEvidenceScreen() {
  const router = useRouter();
  const { updateReport, currentReport } = useReport();
  const { t } = useTranslation();
  const [hasEvidence, setHasEvidence] = useState<"yes" | "no" | "">(
    currentReport?.hasEvidence === true ? "yes" : currentReport?.hasEvidence === false ? "no" : "",
  );
  const [evidenceTypes, setEvidenceTypes] = useState<EvidenceType[]>(
    currentReport?.evidenceTypes ?? [],
  );
  const [evidenceFiles, setEvidenceFiles] = useState<{ name: string; url: string }[]>(
    (currentReport?.documents ?? []).map((d, i) =>
      typeof d === "string"
        ? { name: `doc-${i}`, url: d }
        : {
            name: (d as { name?: string }).name ?? `doc-${i}`,
            url: (d as { url?: string }).url ?? "",
          },
    ),
  );
  const [evidenceDescription, setEvidenceDescription] = useState(
    currentReport?.evidenceDescription ?? "",
  );
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const isValid = hasEvidence === "no" || (hasEvidence === "yes" && evidenceTypes.length > 0);

  const handleEvidenceTypeToggle = (type: EvidenceType) => {
    setEvidenceTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploadError("");
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const { key, name } = await uploadReportFile(file);
        setEvidenceFiles((prev) => [...prev, { name, url: key }]);
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : t("report.evidence.uploadError"));
    } finally {
      setUploading(false);
      e.target.value = "";
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
        documents: hasEvidence === "yes" ? evidenceFiles : [],
      });
      router.push(routes.reportContact);
    }
  };

  const evidenceTypeLabels: Record<string, string> = {
    document: t("report.evidence.types.document"),
    image: t("report.evidence.types.image"),
    video: t("report.evidence.types.video"),
    audio: t("report.evidence.types.audio"),
    witness: t("report.evidence.types.witness"),
  };

  return (
    <div className="bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
            <FileCheck className="text-primary h-8 w-8" />
          </div>
          <CardTitle className="text-2xl">{t("report.evidence.title")}</CardTitle>
          <CardDescription>{t("report.evidence.description")}</CardDescription>
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
                {t("common.yes")}
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
                {t("common.no")}
              </span>
            </button>
          </div>

          {hasEvidence === "yes" && (
            <>
              <div className="space-y-3">
                <Label>
                  {t("report.evidence.evidenceType")} <span className="text-destructive">*</span>
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  {EVIDENCE_TYPES.map((type) => {
                    const Icon =
                      type.value === "document"
                        ? FileText
                        : type.value === "image"
                          ? Image
                          : type.value === "video"
                            ? Video
                            : type.value === "audio"
                              ? Mic
                              : Users;
                    const isSelected = evidenceTypes.includes(type.value);
                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => handleEvidenceTypeToggle(type.value)}
                        className={cn(
                          "border-border flex items-center gap-3 rounded-xl border-2 p-3 text-right transition-all duration-200",
                          isSelected
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "hover:border-primary/50 hover:bg-muted/50",
                        )}
                      >
                        <div
                          className={cn(
                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                            isSelected ? "bg-primary/20" : "bg-muted",
                          )}
                        >
                          <Icon
                            className={cn(
                              "h-5 w-5",
                              isSelected ? "text-primary" : "text-muted-foreground",
                            )}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span
                            className={cn(
                              "text-sm font-medium",
                              isSelected ? "text-primary" : "text-foreground",
                            )}
                          >
                            {evidenceTypeLabels[type.value] ?? type.label}
                          </span>
                        </div>
                        {isSelected && (
                          <div className="bg-primary flex h-5 w-5 shrink-0 items-center justify-center rounded-full">
                            <Check className="text-primary-foreground h-3 w-3" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3">
                <Label>{t("report.evidence.uploadLabel")}</Label>
                <Alert
                  variant="default"
                  className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30"
                >
                  <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <AlertTitle className="text-blue-800 dark:text-blue-200">
                    {t("report.evidence.metadataTitle")}
                  </AlertTitle>
                  <AlertDescription className="text-blue-700 dark:text-blue-300">
                    <p>{t("report.evidence.metadataDescription")}</p>
                    <p className="mt-2">
                      {t("report.evidence.metadataAdvice")}{" "}
                      <a
                        href="https://www.metadata2go.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:no-underline"
                      >
                        metadata2go.com
                      </a>
                    </p>
                  </AlertDescription>
                </Alert>
                {uploadError && (
                  <div className="text-destructive bg-destructive/10 flex items-center gap-2 rounded-lg p-3 text-sm">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {uploadError}
                  </div>
                )}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={uploading}
                  asChild
                >
                  <label>
                    {uploading ? (
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="ml-2 h-4 w-4" />
                    )}
                    {uploading ? t("common.uploading") : t("report.evidence.chooseFile")}
                    <input
                      type="file"
                      multiple
                      accept="image/*,.pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
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
                <Label htmlFor="evidence-desc">{t("report.evidence.descriptionLabel")}</Label>
                <Textarea
                  id="evidence-desc"
                  value={evidenceDescription}
                  onChange={(e) => setEvidenceDescription(e.target.value)}
                  placeholder={t("report.evidence.descriptionPlaceholder")}
                  rows={3}
                />
              </div>
            </>
          )}

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => router.back()} className="flex-1">
              <ArrowRight className="ml-2 h-4 w-4" />
              {t("common.back")}
            </Button>
            <Button onClick={handleNext} disabled={!isValid} className="flex-1">
              {t("common.next")}
              <ArrowLeft className="mr-2 h-4 w-4" />
            </Button>
          </div>
          <ReportWizardProgress step={7} total={8} />
        </CardContent>
      </Card>
    </div>
  );
}
