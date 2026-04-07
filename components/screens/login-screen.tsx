"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/user-context";
import { routes } from "@/lib/routes";
import { getAppBaseUrl } from "@/lib/app-base-url";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { AlertCircle, Eye, EyeOff, LogIn } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/edyen";
import { useTranslation } from "react-i18next";

export function LoginScreen() {
  const router = useRouter();
  const { setUser } = useUser();
  const { t } = useTranslation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const res = await fetch(`${getAppBaseUrl()}/api/session/sign-in`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: username.trim().toLowerCase(),
        password,
        rememberMe: true,
      }),
    });

    if (!res.ok) {
      let msg = t("auth.login.error");
      try {
        const j = (await res.json()) as {
          message?: string;
          error?: string | { message?: string };
        };
        if (typeof j?.message === "string" && j.message) msg = j.message;
        else if (j?.error && typeof j.error === "object" && typeof j.error.message === "string")
          msg = j.error.message;
        else if (typeof j?.error === "string") msg = j.error;
      } catch {
        /* ignore */
      }
      setError(msg);
      setIsLoading(false);
      return;
    }

    const { data: me, error: meError } = await api.me.get();

    if (meError || !me) {
      router.push(routes.login);
      setIsLoading(false);
      return;
    }
    const mustChange = (me as { mustChangePassword?: boolean }).mustChangePassword === true;
    setUser({
      id: me.id,
      passkey: "",
      inviteCode: "",
      isActivated: true,
      tokensCount: me.tokensCount ?? 0,
      approvedRequestsCount: me.approvedRequestsCount ?? 0,
      username: (me as { username?: string }).username,
      name: me.name,
      mustChangePassword: mustChange,
    });
    toast(mustChange ? t("auth.login.successChangePassword") : t("auth.login.success"));
    router.push(mustChange ? routes.changePasswordRequired : routes.mainMenu);

    setIsLoading(false);
  };

  return (
    <div className="bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
            <LogIn className="text-primary h-8 w-8" />
          </div>
          <CardTitle className="text-foreground text-xl font-bold">
            {t("auth.login.title")}
          </CardTitle>
          <CardDescription className="text-xs">{t("auth.login.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">{t("auth.login.username")}</Label>
              <Input
                id="username"
                type="text"
                autoComplete="username"
                placeholder={t("auth.login.usernamePlaceholder")}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="text-center"
                dir="ltr"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("auth.login.password")}</Label>
              <InputGroup>
                <InputGroupInput
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="text-center"
                  dir="ltr"
                  autoComplete="current-password"
                  required
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    type="button"
                    size="icon-xs"
                    variant="ghost"
                    onClick={() => setShowPassword((p) => !p)}
                    aria-label={showPassword ? t("common.hidePassword") : t("common.showPassword")}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
            </div>

            {error && (
              <div className="text-destructive bg-destructive/10 flex items-center gap-2 rounded-lg p-3">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={!username.trim() || !password || isLoading}
            >
              {isLoading ? t("auth.login.submitting") : t("auth.login.submit")}
            </Button>

            <Button type="button" onClick={() => router.back()} variant="ghost" className="w-full">
              {t("common.back")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
