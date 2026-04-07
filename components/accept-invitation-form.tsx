"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, setInviteTokenStorage } from "@/lib/edyen";
import { isValidPublicUsername, normalizeUsername } from "@/lib/username";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, UserPlus } from "lucide-react";
import { useTranslation } from "react-i18next";

interface AcceptInvitationFormProps {
  invitationId: string;
}

export function AcceptInvitationForm({ invitationId }: AcceptInvitationFormProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const u = normalizeUsername(username);
    if (u && !isValidPublicUsername(u)) {
      setError(t("auth.acceptInvitation.usernameError"));
      return;
    }
    setIsLoading(true);

    const { data, error: acceptError } = await api.invite["register-by-code"].post({
      code: invitationId,
      username: u || invitationId,
      passkey: password,
    });

    if (acceptError) {
      setError(t("auth.acceptInvitation.error"));
      setIsLoading(false);
      return;
    }

    if (!data?.ok) {
      setError((data as { error?: string })?.error || t("auth.acceptInvitation.errorFailed"));
      setIsLoading(false);
      return;
    }

    if (data.token) {
      setInviteTokenStorage(data.token);
    }

    if (data.user) {
      router.push("/");
    } else {
      setError(t("auth.acceptInvitation.errorFailed"));
    }

    setIsLoading(false);
  };

  return (
    <div className="bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
            <UserPlus className="text-primary h-8 w-8" />
          </div>
          <CardTitle className="text-foreground text-xl font-bold">
            {t("auth.acceptInvitation.title")}
          </CardTitle>
          <CardDescription>{t("auth.acceptInvitation.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t("auth.acceptInvitation.name")}</Label>
              <Input
                id="name"
                type="text"
                placeholder={t("auth.acceptInvitation.namePlaceholder")}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-center"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">{t("auth.acceptInvitation.username")}</Label>
              <Input
                id="username"
                type="text"
                autoComplete="username"
                placeholder="my_username"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                className="text-center"
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("auth.acceptInvitation.password")}</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="text-center"
                dir="ltr"
                required
              />
            </div>

            {error && (
              <div className="text-destructive bg-destructive/10 flex items-center gap-2 rounded-lg p-3">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={!password || isLoading}>
              {isLoading
                ? t("auth.acceptInvitation.submitting")
                : t("auth.acceptInvitation.submit")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
