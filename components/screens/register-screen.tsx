"use client";

import { useState, useEffect, useLayoutEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp } from "@/context/app-context";
import { api } from "@/lib/edyen";
import { setInviteTokenStorage } from "@/lib/edyen";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { AlertCircle, UserPlus, Eye, EyeOff, Check, Circle } from "lucide-react";
import { routes } from "@/lib/routes";
import { isPasswordSecure, getPasswordStrength, PASSWORD_RULES } from "@/lib/password-utils";

const PASSWORD_REQUIREMENTS = [
  {
    key: "minLength" as const,
    label: "حداقل ۸ کاراکتر",
    check: (p: string) => p.length >= PASSWORD_RULES.minLength,
  },
  {
    key: "hasUppercase" as const,
    label: "یک حرف بزرگ (A-Z)",
    check: (p: string) => /[A-Z]/.test(p),
  },
  {
    key: "hasLowercase" as const,
    label: "یک حرف کوچک (a-z)",
    check: (p: string) => /[a-z]/.test(p),
  },
  { key: "hasNumber" as const, label: "یک عدد (0-9)", check: (p: string) => /[0-9]/.test(p) },
  {
    key: "hasSpecial" as const,
    label: "یک کاراکتر خاص (!@#$%)",
    check: (p: string) => /[$@#!%*?&#^()[\]{}_\-+=.,:;]/.test(p),
  },
];

export function RegisterScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useApp();
  const codeParam = searchParams.get("code");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
    if (!isPasswordSecure(password)) {
      setError("لطفاً رمز عبوری امن انتخاب کنید و تمام قوانین را رعایت کنید.");
      return;
    }
    if (password !== passwordConfirm) {
      setError("رمز عبور با تکرار آن یکسان نیست.");
      return;
    }
    setIsLoading(true);

    const { data, error: regError } = await api.invite["register-by-code"].post({
      code: codeParam!,
      email: email.trim(),
      passkey: password,
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

    const result = data as {
      ok: boolean;
      token: string;
      user?: { id: string; name?: string; tokensCount?: number; approvedRequestsCount?: number };
    };
    if (result.token) {
      setInviteTokenStorage(result.token);
    }
    if (result.user) {
      setUser({
        id: result.user.id,
        name: result.user.name ?? "",
        passkey: "",
        inviteCode: "",
        isActivated: true,
        tokensCount: result.user.tokensCount ?? 0,
        approvedRequestsCount: result.user.approvedRequestsCount ?? 0,
      } as Parameters<typeof setUser>[0]);
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
              <Label htmlFor="password">رمز عبور</Label>
              <InputGroup>
                <InputGroupInput
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="text-center"
                  dir="ltr"
                  minLength={PASSWORD_RULES.minLength}
                  required
                  aria-invalid={password.length > 0 && !isPasswordSecure(password)}
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    type="button"
                    size="icon-xs"
                    variant="ghost"
                    onClick={() => setShowPassword((p) => !p)}
                    aria-label={showPassword ? "مخفی کردن رمز عبور" : "نمایش رمز عبور"}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
              {password.length > 0 && (
                <div className="space-y-1.5">
                  <Progress value={getPasswordStrength(password)} className="h-1.5" />
                  <ul className="text-muted-foreground space-y-0.5 text-xs">
                    {PASSWORD_REQUIREMENTS.map(({ key, label, check }) => (
                      <li key={key} className="flex items-center gap-2">
                        {check(password) ? (
                          <Check className="size-3.5 shrink-0 text-green-600 dark:text-green-500" />
                        ) : (
                          <Circle className="size-3 shrink-0 opacity-40" />
                        )}
                        {label}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password-confirm">تکرار رمز عبور</Label>
              <InputGroup>
                <InputGroupInput
                  id="password-confirm"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  className="text-center"
                  dir="ltr"
                  required
                  aria-invalid={passwordConfirm.length > 0 && password !== passwordConfirm}
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    type="button"
                    size="icon-xs"
                    variant="ghost"
                    onClick={() => setShowPassword((p) => !p)}
                    aria-label={showPassword ? "مخفی کردن رمز عبور" : "نمایش رمز عبور"}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
              {passwordConfirm.length > 0 && password !== passwordConfirm && (
                <p className="text-destructive text-xs">رمز عبور با تکرار آن یکسان نیست</p>
              )}
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
              disabled={
                !email.trim() ||
                !isPasswordSecure(password) ||
                password !== passwordConfirm ||
                isLoading
              }
            >
              {isLoading ? "در حال ثبت‌نام..." : "ثبت‌نام"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
