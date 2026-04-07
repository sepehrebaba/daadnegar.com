"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info } from "lucide-react";
import { routes } from "@/lib/routes";
import { useTranslation } from "react-i18next";

export default function AboutPage() {
  const { t } = useTranslation();

  return (
    <div className="bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
            <Info className="text-primary h-8 w-8" />
          </div>
          <CardTitle className="text-foreground text-xl font-bold">{t("about.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-justify leading-relaxed">
            {t("about.description1")}
          </p>
          <p className="text-muted-foreground text-justify leading-relaxed">
            {t("about.description2")}
          </p>
          <Link
            href={routes.home}
            className="border-border bg-background hover:bg-accent hover:text-accent-foreground ring-offset-background focus-visible:ring-ring mt-6 flex w-full items-center justify-center rounded-md border px-4 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            {t("common.back")}
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
