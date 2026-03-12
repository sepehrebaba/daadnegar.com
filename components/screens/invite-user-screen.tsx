"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api, DADBAN_INVITE_TOKEN_KEY } from "@/lib/edyen";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle, Mail, Copy, Check } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";

export function InviteUserScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const copyToClipboard = useCallback(async () => {
    if (!inviteCode) return;
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = inviteCode;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [inviteCode]);

  const handlePersonalInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setInviteCode("");
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

    const res = data as { ok?: boolean; code?: string; registerLink?: string } | null;
    const code = res?.code ?? "";
    setInviteCode(code);
    setSuccessMessage(
      trimmedEmail
        ? `دعوت به ${trimmedEmail} ارسال شد.`
        : "کد دعوت با موفقیت ایجاد شد. این کد یک‌بار مصرف است.",
    );
    setEmail("");
    setIsLoading(false);
  };

  const handlePublicInvite = async () => {
    setError("");
    setSuccessMessage("");
    setInviteCode("");
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
    const res = data as { ok?: boolean; code?: string; registerLink?: string } | null;
    if (res && !res.ok) {
      setError((res as { error?: string })?.error || "خطا در ایجاد دعوت عمومی.");
      setIsLoading(false);
      return;
    }

    const code = res?.code ?? "";
    setInviteCode(code);
    setSuccessMessage("کد دعوت با موفقیت ایجاد شد. این کد یک‌بار مصرف است.");
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

            {successMessage && inviteCode && (
              <div className="space-y-3 rounded-lg border border-green-200 bg-green-50/50 p-4 dark:border-green-900/50 dark:bg-green-950/20">
                <div className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-green-600 dark:text-green-500" />
                  <span className="text-foreground text-sm">{successMessage}</span>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs">کد دعوت</Label>
                  <InputGroup>
                    <InputGroupInput
                      value={inviteCode}
                      readOnly
                      className="text-center font-mono text-lg font-bold tracking-widest"
                      dir="ltr"
                    />
                    <InputGroupAddon align="inline-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={copyToClipboard}
                        className="gap-2"
                      >
                        {copied ? (
                          <>
                            <Check className="h-4 w-4 text-green-600" />
                            کپی شد!
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4" />
                            کپی
                          </>
                        )}
                      </Button>
                    </InputGroupAddon>
                  </InputGroup>
                </div>
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
