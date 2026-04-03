"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Languages, Moon, Monitor, Sun, KeyRound } from "lucide-react";
import { useLanguage } from "@/context/language-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { isPasswordSecure, getPasswordStrength, checkPassword } from "@/lib/password-utils";
import { Progress } from "@/components/ui/progress";

export default function AdminUserSettingsPage() {
  const { theme, setTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const [panelUsername, setPanelUsername] = useState<string | null>(null);
  const [panelMeReady, setPanelMeReady] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMessage, setPwMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin-panel/auth/me", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setPanelUsername(d?.user?.username ?? null))
      .catch(() => setPanelUsername(null))
      .finally(() => setPanelMeReady(true));
  }, []);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMessage(null);
    if (!isPasswordSecure(newPassword)) {
      setPwMessage({
        type: "err",
        text: "رمز جدید باید حداقل ۸ کاراکتر و شامل حرف بزرگ، حرف کوچک، عدد و کاراکتر خاص باشد",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwMessage({ type: "err", text: "تکرار رمز عبور با رمز جدید یکسان نیست" });
      return;
    }
    setPwSaving(true);
    try {
      const res = await fetch("/api/admin-panel/auth/password", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPwMessage({
          type: "err",
          text: typeof data?.error === "string" ? data.error : "ذخیره رمز عبور ناموفق بود",
        });
        return;
      }
      setPwMessage({ type: "ok", text: "رمز عبور با موفقیت به‌روزرسانی شد" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setPwMessage({ type: "err", text: "خطای شبکه؛ دوباره تلاش کنید" });
    } finally {
      setPwSaving(false);
    }
  };

  const check = checkPassword(newPassword);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">تنظیمات کاربر</h1>
        <p className="text-muted-foreground mt-1 text-sm">زبان، تم و رمز عبور ورود به پنل ادمین</p>
        {panelMeReady && panelUsername && (
          <p className="text-muted-foreground mt-2 text-sm">
            نام کاربری پنل: <span className="text-foreground font-medium">{panelUsername}</span>
          </p>
        )}
        {panelMeReady && !panelUsername && (
          <p className="text-muted-foreground mt-2 text-sm">
            با حساب کاربری سایت به ادمین دسترسی دارید؛ تغییر رمز زیر فقط برای ورود با نام کاربری/رمز
            پنل ادمین است.
          </p>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Languages className="h-5 w-5" />
            زبان
          </CardTitle>
          <CardDescription>جهت نمایش رابط (راست‌چین / چپ‌چین)</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={language === "fa" ? "default" : "outline"}
            className="min-w-32 flex-1 gap-2"
            onClick={() => setLanguage("fa")}
          >
            فارسی
          </Button>
          <Button
            type="button"
            variant={language === "en" ? "default" : "outline"}
            className="min-w-32 flex-1 gap-2"
            onClick={() => setLanguage("en")}
          >
            English
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sun className="h-5 w-5" />
            تم
          </CardTitle>
          <CardDescription>حالت روشن، تیره یا هماهنگ با سیستم</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={theme === "light" ? "default" : "outline"}
            className="min-w-22 flex-1 gap-2"
            onClick={() => setTheme("light")}
          >
            <Sun className="h-4 w-4" />
            روشن
          </Button>
          <Button
            type="button"
            variant={theme === "dark" ? "default" : "outline"}
            className="min-w-22 flex-1 gap-2"
            onClick={() => setTheme("dark")}
          >
            <Moon className="h-4 w-4" />
            تیره
          </Button>
          <Button
            type="button"
            variant={theme === "system" || !theme ? "default" : "outline"}
            className="min-w-22 flex-1 gap-2"
            onClick={() => setTheme("system")}
          >
            <Monitor className="h-4 w-4" />
            سیستم
          </Button>
        </CardContent>
      </Card>

      <Card className={panelMeReady && !panelUsername ? "opacity-80" : undefined}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <KeyRound className="h-5 w-5" />
            تغییر رمز عبور پنل
          </CardTitle>
          <CardDescription>
            رمز فعلی و رمز جدید حساب ورود با نام کاربری پنل (صفحهٔ ورود ادمین)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-cur-pw">رمز عبور فعلی</Label>
              <Input
                id="admin-cur-pw"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-new-pw">رمز عبور جدید</Label>
              <Input
                id="admin-new-pw"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                aria-invalid={newPassword.length > 0 && !isPasswordSecure(newPassword)}
              />
              {newPassword.length > 0 && (
                <div className="space-y-1">
                  <Progress value={getPasswordStrength(newPassword)} className="h-1.5" />
                  <ul className="text-muted-foreground space-y-0.5 text-xs">
                    <li className={cn(check.minLength && "text-green-600 dark:text-green-500")}>
                      حداقل ۸ کاراکتر
                    </li>
                    <li className={cn(check.hasUppercase && "text-green-600 dark:text-green-500")}>
                      حرف بزرگ انگلیسی
                    </li>
                    <li className={cn(check.hasLowercase && "text-green-600 dark:text-green-500")}>
                      حرف کوچک انگلیسی
                    </li>
                    <li className={cn(check.hasNumber && "text-green-600 dark:text-green-500")}>
                      عدد
                    </li>
                    <li className={cn(check.hasSpecial && "text-green-600 dark:text-green-500")}>
                      کاراکتر خاص
                    </li>
                  </ul>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-confirm-pw">تکرار رمز جدید</Label>
              <Input
                id="admin-confirm-pw"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                aria-invalid={confirmPassword.length > 0 && confirmPassword !== newPassword}
              />
            </div>
            {pwMessage && (
              <p
                className={cn(
                  "text-sm",
                  pwMessage.type === "ok"
                    ? "text-green-600 dark:text-green-500"
                    : "text-destructive",
                )}
              >
                {pwMessage.text}
              </p>
            )}
            <Button
              type="submit"
              disabled={
                !panelMeReady ||
                !panelUsername ||
                pwSaving ||
                !currentPassword ||
                !isPasswordSecure(newPassword) ||
                newPassword !== confirmPassword
              }
            >
              {pwSaving ? "در حال ذخیره..." : "ذخیره رمز عبور"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
