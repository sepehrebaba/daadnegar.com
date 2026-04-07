"use client";

import { useTranslation } from "react-i18next";
import { Progress } from "@/components/ui/progress";
import { toPersianNum } from "@/lib/utils";

interface ReportWizardProgressProps {
  step: number;
  total?: number;
}

export function ReportWizardProgress({ step, total = 8 }: ReportWizardProgressProps) {
  const { t } = useTranslation();
  const value = total > 0 ? Math.round((step / total) * 100) : 0;

  return (
    <div className="space-y-2 pt-2">
      <Progress value={value} className="h-2" />
      <p className="text-muted-foreground text-center text-sm">
        {t("reportWizardProgress.step", { step: toPersianNum(step), total: toPersianNum(total) })}
      </p>
    </div>
  );
}
