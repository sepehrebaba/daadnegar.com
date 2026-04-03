"use client";

import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Languages, Settings, Sun, Moon, Monitor, User } from "lucide-react";
import { useTheme } from "next-themes";
import { useUser } from "@/context/user-context";
import { useLanguage } from "@/context/language-context";

export function SettingsForm() {
  const { theme, setTheme } = useTheme();
  const { user } = useUser();
  const { language, setLanguage } = useLanguage();

  return (
    <>
      <CardHeader className="text-center">
        <div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
          <Settings className="text-primary h-8 w-8" />
        </div>
        <CardTitle className="text-foreground text-2xl font-bold">تنظیمات</CardTitle>
        <CardDescription>مدیریت تنظیمات حساب کاربری</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="space-y-3">
          <h3 className="text-foreground text-sm font-medium">زبان</h3>
          <div className="flex gap-2">
            <Button
              variant={language === "fa" ? "default" : "outline"}
              className="flex-1 gap-2"
              onClick={() => setLanguage("fa")}
            >
              <Languages className="h-4 w-4" />
              فارسی
            </Button>
            <Button
              variant={language === "en" ? "default" : "outline"}
              className="flex-1 gap-2"
              onClick={() => setLanguage("en")}
            >
              <Languages className="h-4 w-4" />
              English
            </Button>
          </div>
        </div>
        <div className="space-y-3">
          <h3 className="text-foreground text-sm font-medium">تم</h3>
          <div className="flex gap-2">
            <Button
              variant={theme === "light" ? "default" : "outline"}
              className="flex-1 gap-2"
              onClick={() => setTheme("light")}
            >
              <Sun className="h-4 w-4" />
              روشن
            </Button>
            <Button
              variant={theme === "dark" ? "default" : "outline"}
              className="flex-1 gap-2"
              onClick={() => setTheme("dark")}
            >
              <Moon className="h-4 w-4" />
              تیره
            </Button>
            <Button
              variant={theme === "system" || !theme ? "default" : "outline"}
              className="flex-1 gap-2"
              onClick={() => setTheme("system")}
            >
              <Monitor className="h-4 w-4" />
              سیستم
            </Button>
          </div>
        </div>
        <div className="border-border my-2 border-t" />
        <div className="text-foreground/80 flex items-center justify-center gap-2 text-center text-sm font-medium">
          <User className="text-muted-foreground h-4 w-4" />
          {user?.username ?? "—"}
        </div>
      </CardContent>
    </>
  );
}
