"use client";

import { useTranslation } from "react-i18next";

export function LoadingFallback({ className }: { className?: string }) {
  const { t } = useTranslation();
  return (
    <div className={className ?? "flex min-h-screen items-center justify-center"}>
      {t("common.loading")}
    </div>
  );
}
