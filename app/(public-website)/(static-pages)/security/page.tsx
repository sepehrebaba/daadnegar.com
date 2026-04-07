"use client";

import Link from "next/link";
import { routes } from "@/lib/routes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, EyeOff, Lock } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function SecurityPage() {
  const { t } = useTranslation();

  return (
    <div className="bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="bg-accent/20 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
            <ShieldCheck className="text-accent-foreground h-8 w-8" />
          </div>
          <CardTitle className="text-foreground text-xl font-bold">{t("security.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-secondary flex items-start gap-4 rounded-lg p-4">
            <EyeOff className="text-primary mt-1 h-6 w-6 flex-shrink-0" />
            <div>
              <h3 className="text-foreground font-semibold">{t("security.noTracking")}</h3>
              <p className="text-muted-foreground mt-1 text-sm">
                {t("security.noTrackingDescription")}
              </p>
            </div>
          </div>

          <div className="bg-secondary flex items-start gap-4 rounded-lg p-4">
            <Lock className="text-primary mt-1 h-6 w-6 flex-shrink-0" />
            <div>
              <h3 className="text-foreground font-semibold">{t("security.encryption")}</h3>
              <p className="text-muted-foreground mt-1 text-sm">
                {t("security.encryptionDescription")}
              </p>
            </div>
          </div>

          <Link
            href={routes.home}
            className="border-input bg-background hover:bg-accent hover:text-accent-foreground ring-offset-background flex w-full items-center justify-center rounded-md border px-4 py-2 text-sm font-medium transition-colors"
          >
            {t("common.back")}
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
