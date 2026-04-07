"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { routes } from "@/lib/routes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

function ReportSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const tokensAwarded = Number(searchParams.get("tokens") || 0);

  const handleBackToMenu = () => {
    router.push(routes.mainMenu);
  };

  return (
    <div className="bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <CardTitle className="text-foreground text-xl font-bold">
            {t("report.success.title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-secondary rounded-lg p-4 text-center">
            <p className="text-muted-foreground">{t("report.success.description")}</p>
          </div>

          {tokensAwarded > 0 && (
            <div className="bg-primary/5 border-primary/20 rounded-lg border p-4 text-center">
              <p className="text-primary text-sm font-medium">
                {t("report.success.tokensAwarded", { count: tokensAwarded })}
              </p>
            </div>
          )}

          <Button onClick={handleBackToMenu} className="w-full">
            {t("report.success.backToMenu")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export function ReportSuccessScreen() {
  return (
    <Suspense
      fallback={
        <div className="bg-background flex min-h-[200px] items-center justify-center p-4" />
      }
    >
      <ReportSuccessContent />
    </Suspense>
  );
}
