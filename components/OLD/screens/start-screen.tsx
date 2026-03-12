"use client";

import { useApp } from "@/context/app-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function StartScreen() {
  const { navigate, setLanguage } = useApp();

  const handleLanguageSelect = (lang: "fa" | "en") => {
    console.log("[v0] User selected language:", lang);
    setLanguage(lang);
    navigate("welcome");
  };

  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-foreground text-2xl font-bold">
            زبان مورد نظر را انتخاب کنید
          </CardTitle>
          <p className="text-muted-foreground mt-2">Select your preferred language</p>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Button
            onClick={() => handleLanguageSelect("fa")}
            className="w-full py-6 text-lg"
            variant="default"
          >
            فارسی
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
