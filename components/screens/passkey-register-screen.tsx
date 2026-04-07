"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, getInviteToken } from "@/lib/edyen";
import { useUser } from "@/context/user-context";
import { routes } from "@/lib/routes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Fingerprint } from "lucide-react";
import type { User } from "@/types";
import { useTranslation } from "react-i18next";

function extractErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message) || fallback;
  }
  return fallback;
}

export function PasskeyRegisterScreen() {
  const router = useRouter();
  const { setUser } = useUser();
  const { t } = useTranslation();
  const [passkey, setPasskey] = useState("");
  const [confirmPasskey, setConfirmPasskey] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (passkey.length < 6) {
      setError(t("auth.passkey.minLength"));
      return;
    }

    if (passkey !== confirmPasskey) {
      setError(t("auth.passkey.mismatch"));
      return;
    }

    setIsLoading(true);

    const token = getInviteToken();
    if (!token) {
      setError(t("auth.passkey.noToken"));
      setIsLoading(false);
      return;
    }

    const { data, error: apiError } = await api.invite.register.post({ token, passkey });
    if (apiError || !data) {
      setError(extractErrorMessage(apiError, t("auth.passkey.registerError")));
      setIsLoading(false);
      return;
    }
    const result = data as { ok?: boolean; error?: string; user?: User };
    if (!result.ok) {
      setError(result.error ?? t("auth.passkey.registerError"));
      setIsLoading(false);
      return;
    }
    if (!result.user) {
      setError(t("auth.passkey.userError"));
      setIsLoading(false);
      return;
    }

    setUser(result.user);
    router.push(routes.mainMenu);
    setIsLoading(false);
  };

  return (
    <div className="bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="bg-accent/20 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
            <Fingerprint className="text-accent-foreground h-8 w-8" />
          </div>
          <CardTitle className="text-foreground text-xl font-bold">
            {t("auth.passkey.registerTitle")}
          </CardTitle>
          <CardDescription>{t("auth.passkey.registerDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="passkey">{t("auth.passkey.passkey")}</Label>
              <Input
                id="passkey"
                type="password"
                placeholder={t("auth.passkey.minPlaceholder")}
                value={passkey}
                onChange={(e) => setPasskey(e.target.value)}
                dir="ltr"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm">{t("auth.passkey.confirmPasskey")}</Label>
              <Input
                id="confirm"
                type="password"
                placeholder={t("auth.passkey.confirmPasskeyPlaceholder")}
                value={confirmPasskey}
                onChange={(e) => setConfirmPasskey(e.target.value)}
                dir="ltr"
              />
            </div>

            {error && (
              <div className="text-destructive bg-destructive/10 flex items-center gap-2 rounded-lg p-3">
                <AlertCircle className="h-5 w-5" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={!passkey || !confirmPasskey || isLoading}
            >
              {isLoading ? t("auth.passkey.submittingRegister") : t("auth.passkey.submitRegister")}
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
