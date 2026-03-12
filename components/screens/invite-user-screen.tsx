"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, DADBAN_INVITE_TOKEN_KEY } from "@/lib/edyen";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle, Mail } from "lucide-react";

export function InviteUserScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handlePersonalInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    const trimmedEmail = email.trim();
    const body = trimmedEmail
      ? { type: "personal" as const, email: trimmedEmail }
      : { type: "public" as const };
    const token =
      typeof window !== "undefined" ? localStorage.getItem(DADBAN_INVITE_TOKEN_KEY) : null;
    const opts = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    const { data, error: inviteError } = await api.invite["invite-user"].post(body, opts);

    if (inviteError?.value) {
      const errMsg = inviteError?.value?.error?.message || "خطا در ارسال دعوت.";
      setError(errMsg);
      setIsLoading(false);
      return;
    }
    if (data && !(data as { ok?: boolean }).ok) {
      setError((data as { error?: string })?.error || "خطا در ارسال دعوت.");
      setIsLoading(false);
      return;
    }

    setSuccess(
      email
        ? `دعوت نامه به ${email} ارسال شد.`
        : "دعوت عمومی ایجاد شد. لینک را با سایرین به اشتراک بگذارید.",
    );
    setEmail("");
    setIsLoading(false);
  };

  const handlePublicInvite = async () => {
    setError("");
    setSuccess("");
    setIsLoading(true);

    const token =
      typeof window !== "undefined" ? localStorage.getItem(DADBAN_INVITE_TOKEN_KEY) : null;
    const opts = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    const { data, error: inviteError } = await api.invite["invite-user"].post(
      { type: "public" },
      opts,
    );

    if (inviteError) {
      const errMsg =
        typeof inviteError === "string"
          ? inviteError
          : (inviteError as { message?: string })?.message || "خطا در ایجاد دعوت عمومی.";
      setError(errMsg);
      setIsLoading(false);
      return;
    }
    const res = data as { ok?: boolean; id?: string; inviteLink?: string } | null;
    if (res && !res.ok) {
      setError((res as { error?: string })?.error || "خطا در ایجاد دعوت عمومی.");
      setIsLoading(false);
      return;
    }

    const inviteLink =
      res?.inviteLink ??
      (res?.id
        ? `${typeof window !== "undefined" ? window.location.origin : ""}/accept-invitation?invitationId=${res.id}`
        : "");
    setSuccess(`لینک دعوت عمومی: ${inviteLink}`);
    setIsLoading(false);
  };

  return (
    <div className="bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
            <Mail className="text-primary h-8 w-8" />
          </div>
          <CardTitle className="text-foreground text-xl font-bold">دعوت کاربر</CardTitle>
          <CardDescription>ایمیل کاربر را وارد کنید یا یک دعوت عمومی ایجاد کنید</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handlePersonalInvite} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">ایمیل (خالی = دعوت عمومی)</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="text-center"
                dir="ltr"
              />
            </div>

            {error && (
              <div className="text-destructive bg-destructive/10 flex items-center gap-2 rounded-lg p-3">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-green-600 dark:bg-green-950/30">
                <CheckCircle className="h-5 w-5 shrink-0" />
                <span className="text-sm">{success}</span>
              </div>
            )}

            <div className="flex gap-2">
              <Button type="submit" className="flex-1" disabled={isLoading}>
                {isLoading ? "در حال ارسال..." : email ? "ارسال دعوت" : "ایجاد دعوت عمومی"}
              </Button>
              {!email && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePublicInvite}
                  disabled={isLoading}
                >
                  دعوت عمومی
                </Button>
              )}
            </div>

            <Button type="button" onClick={() => router.back()} variant="ghost" className="w-full">
              بازگشت
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
