"use client";

import { useState, useEffect, useLayoutEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/edyen";
import { DADBAN_INVITE_TOKEN_KEY } from "@/lib/edyen";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, UserPlus } from "lucide-react";
import { routes } from "@/lib/routes";

export function RegisterScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const codeParam = searchParams.get("code");

  const [email, setEmail] = useState("");
  const [passkey, setPasskey] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  // Immediate redirect when no valid code - runs before paint
  useLayoutEffect(() => {
    const code = codeParam?.trim();
    if (!code) {
      router.replace(routes.home);
      setShouldRedirect(true);
    }
  }, [codeParam, router]);

  useEffect(() => {
    const code = codeParam?.trim();
    if (!code || shouldRedirect) return;

    let cancelled = false;
    const check = async () => {
      const { data } = await api.invite["check-code"].get({ query: { code } });
      if (cancelled) return;
      if (!data?.ok) {
        router.replace(routes.home);
        return;
      }
      setIsValidating(false);
    };
    void check();
    return () => {
      cancelled = true;
    };
  }, [codeParam, router, shouldRedirect]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const { data, error: regError } = await api.invite["register-by-code"].post({
      code: codeParam!,
      email: email.trim(),
      passkey,
    });

    if (regError || !data?.ok) {
      setError(
        (regError as { message?: string })?.message ||
          (data as { error?: string })?.error ||
          "خطا در ثبت‌نام. لطفاً دوباره تلاش کنید.",
      );
      setIsLoading(false);
      return;
    }

    const result = data as { ok: boolean; token: string };
    if (result.token) {
      localStorage.setItem(DADBAN_INVITE_TOKEN_KEY, result.token);
    }
    router.push(routes.mainMenu);
    setIsLoading(false);
  };

  if (isValidating) {
    return (
      <div className="bg-background flex items-center justify-center p-4">
        <div className="text-center">در حال بررسی کد دعوت...</div>
      </div>
    );
  }

  return (
    <div className="bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
            <UserPlus className="text-primary h-8 w-8" />
          </div>
          <CardTitle className="text-foreground text-xl font-bold">ثبت‌نام</CardTitle>
          <CardDescription>ایمیل و رمز عبور خود را برای تکمیل ثبت‌نام وارد کنید</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">ایمیل</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="text-center"
                dir="ltr"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">رمز عبور (حداقل ۶ کاراکتر)</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={passkey}
                onChange={(e) => setPasskey(e.target.value)}
                className="text-center"
                dir="ltr"
                minLength={6}
                required
              />
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
              disabled={!email.trim() || passkey.length < 6 || isLoading}
            >
              {isLoading ? "در حال ثبت‌نام..." : "ثبت‌نام"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
