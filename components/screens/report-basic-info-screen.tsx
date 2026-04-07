"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useReport } from "@/context/report-context";
import { routes } from "@/lib/routes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, ArrowLeft, FileText, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ReportWizardProgress } from "@/components/report-wizard-progress";
import { useTranslation } from "react-i18next";

export function ReportBasicInfoScreen() {
  const router = useRouter();
  const { updateReport, currentReport } = useReport();
  const { t } = useTranslation();
  const [title, setTitle] = useState(currentReport?.title || "");
  const [description, setDescription] = useState(currentReport?.description || "");

  const titleLength = title.length;
  const descriptionLength = description.length;
  const isTitleValid = titleLength > 0 && titleLength <= 120;
  const isDescriptionValid = descriptionLength >= 120 && descriptionLength <= 10000;
  const isValid = isTitleValid && isDescriptionValid;

  const handleNext = () => {
    if (isValid) {
      updateReport({ title, description });
      router.push(routes.reportOrganization);
    }
  };

  return (
    <div className="bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
            <FileText className="text-primary h-8 w-8" />
          </div>
          <CardTitle className="text-2xl">{t("report.basicInfo.title")}</CardTitle>
          <CardDescription>{t("report.basicInfo.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">
              {t("report.basicInfo.reportTitle")} <span className="text-destructive">*</span>
            </Label>

            <Alert size="xs" variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{t("report.basicInfo.titleWarning")}</AlertDescription>
            </Alert>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("report.basicInfo.titlePlaceholder")}
              maxLength={120}
            />

            <div className="text-muted-foreground flex justify-between text-xs">
              <span>{t("report.basicInfo.titleCounter", { count: titleLength })}</span>
              {titleLength > 120 && (
                <span className="text-destructive">{t("report.basicInfo.titleMax")}</span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              {t("report.basicInfo.descriptionLabel")} <span className="text-destructive">*</span>
            </Label>

            <Alert size="xs" variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{t("report.basicInfo.descriptionWarning")}</AlertDescription>
            </Alert>

            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("report.basicInfo.descriptionPlaceholder")}
              rows={8}
              maxLength={10000}
              className="min-h-32 resize-none"
            />
            <div className="text-muted-foreground flex justify-between text-xs">
              <span>{t("report.basicInfo.descriptionCounter", { count: descriptionLength })}</span>
              {descriptionLength < 120 && (
                <span className="text-amber-600">
                  {t("report.basicInfo.descriptionMin", { remaining: 120 - descriptionLength })}
                </span>
              )}
            </div>
          </div>

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

          <ReportWizardProgress step={2} total={8} />
        </CardContent>
      </Card>
    </div>
  );
}
