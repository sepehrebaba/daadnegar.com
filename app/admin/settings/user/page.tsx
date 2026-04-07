"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
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
        text: t("adminSettings.user.passwordInvalid"),
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwMessage({ type: "err", text: t("adminSettings.user.passwordMismatch") });
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
          text:
            typeof data?.error === "string"
              ? data.error
              : t("adminSettings.user.passwordSaveFailed"),
        });
        return;
      }
      setPwMessage({ type: "ok", text: t("adminSettings.user.passwordUpdated") });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setPwMessage({ type: "err", text: t("adminSettings.user.networkError") });
    } finally {
      setPwSaving(false);
    }
  };

  const check = checkPassword(newPassword);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("adminSettings.user.title")}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{t("adminSettings.user.description")}</p>
        {panelMeReady && panelUsername && (
          <p className="text-muted-foreground mt-2 text-sm">
            {t("adminSettings.user.panelUsername")}{" "}
            <span className="text-foreground font-medium">{panelUsername}</span>
          </p>
        )}
        {panelMeReady && !panelUsername && (
          <p className="text-muted-foreground mt-2 text-sm">
            {t("adminSettings.user.siteUserAccess")}
          </p>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Languages className="h-5 w-5" />
            {t("settings.language")}
          </CardTitle>
          <CardDescription>{t("settings.languageDirection")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={language === "fa" ? "default" : "outline"}
            className="min-w-32 flex-1 gap-2"
            onClick={() => setLanguage("fa")}
          >
            {t("nav.persian")}
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
            {t("settings.theme")}
          </CardTitle>
          <CardDescription>{t("settings.themeDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={theme === "light" ? "default" : "outline"}
            className="min-w-22 flex-1 gap-2"
            onClick={() => setTheme("light")}
          >
            <Sun className="h-4 w-4" />
            {t("settings.light")}
          </Button>
          <Button
            type="button"
            variant={theme === "dark" ? "default" : "outline"}
            className="min-w-22 flex-1 gap-2"
            onClick={() => setTheme("dark")}
          >
            <Moon className="h-4 w-4" />
            {t("settings.dark")}
          </Button>
          <Button
            type="button"
            variant={theme === "system" || !theme ? "default" : "outline"}
            className="min-w-22 flex-1 gap-2"
            onClick={() => setTheme("system")}
          >
            <Monitor className="h-4 w-4" />
            {t("settings.system")}
          </Button>
        </CardContent>
      </Card>

      <Card className={panelMeReady && !panelUsername ? "opacity-80" : undefined}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <KeyRound className="h-5 w-5" />
            {t("adminSettings.user.changePanelPassword")}
          </CardTitle>
          <CardDescription>
            {t("adminSettings.user.changePanelPasswordDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-cur-pw">{t("adminSettings.user.currentPassword")}</Label>
              <Input
                id="admin-cur-pw"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-new-pw">{t("adminSettings.user.newPassword")}</Label>
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
                      {t("adminSettings.user.minLength")}
                    </li>
                    <li className={cn(check.hasUppercase && "text-green-600 dark:text-green-500")}>
                      {t("adminSettings.user.hasUppercase")}
                    </li>
                    <li className={cn(check.hasLowercase && "text-green-600 dark:text-green-500")}>
                      {t("adminSettings.user.hasLowercase")}
                    </li>
                    <li className={cn(check.hasNumber && "text-green-600 dark:text-green-500")}>
                      {t("adminSettings.user.hasNumber")}
                    </li>
                    <li className={cn(check.hasSpecial && "text-green-600 dark:text-green-500")}>
                      {t("adminSettings.user.hasSpecial")}
                    </li>
                  </ul>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-confirm-pw">{t("adminSettings.user.confirmPassword")}</Label>
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
              {pwSaving ? t("common.saving") : t("adminSettings.user.savePassword")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
