"use client";

import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/language-context";
import { routes } from "@/lib/routes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "react-i18next";

export function StartScreen() {
  const router = useRouter();
  const { setLanguage } = useLanguage();
  const { t } = useTranslation();

  const handleLanguageSelect = (lang: "fa" | "en") => {
    setLanguage(lang);
    router.push(routes.home);
  };

  return (
    <div className="bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-foreground text-2xl font-bold">{t("start.title")}</CardTitle>
          <p className="text-muted-foreground mt-2">{t("start.subtitle")}</p>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Button
            onClick={() => handleLanguageSelect("fa")}
            className="w-full py-6 text-lg"
            variant="default"
          >
            {t("nav.persian")}
          </Button>
          <Button
            onClick={() => handleLanguageSelect("en")}
            className="w-full py-6 text-lg"
            variant="outline"
          >
            English
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
