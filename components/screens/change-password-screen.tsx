"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/app-context";
import { routes } from "@/lib/routes";
import { api } from "@/lib/edyen";
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
import { isPasswordSecure, getPasswordStrength, PASSWORD_RULES } from "@/lib/password-utils";
import { AlertCircle, Eye, EyeOff, KeyRound, Check, Circle } from "lucide-react";
import { toast } from "sonner";

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

export function ChangePasswordScreen() {
  const router = useRouter();
  const { setUser } = useApp();
  const [checking, setChecking] = useState(true);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { data, error: e } = await api.me.get();
      if (cancelled) return;
      if (e || !data) {
        router.replace(routes.login);
        return;
      }
      const me = data as {
        mustChangePassword?: boolean;
        id: string;
        name?: string;
        username?: string;
        tokensCount?: number;
        approvedRequestsCount?: number;
        role?: string;
        inviteCode?: string;
      };
      setUser({
        id: me.id,
        passkey: "",
        inviteCode: me.inviteCode ?? "",
        isActivated: true,
        tokensCount: me.tokensCount ?? 0,
        approvedRequestsCount: me.approvedRequestsCount ?? 0,
        role: me.role ?? "user",
        username: me.username,
        name: me.name,
        mustChangePassword: me.mustChangePassword ?? false,
      });
      if (!me.mustChangePassword) {
        router.replace(routes.mainMenu);
        return;
      }
      setChecking(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [router, setUser]);

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setError("");
    if (!isPasswordSecure(newPassword)) {
      setError("رمز جدید باید تمام قوانین امنیتی را رعایت کند.");
      return;
    }
    if (newPassword !== confirm) {
      setError("تکرار رمز با رمز جدید یکسان نیست.");
      return;
    }
    setLoading(true);
    const { error: apiErr } = await api.me["change-password"].post({
      currentPassword,
      newPassword,
    });
    setLoading(false);
    if (apiErr) {
      setError((apiErr as { message?: string })?.message ?? "خطا در تغییر رمز عبور");
      return;
    }
    toast("رمز عبور با موفقیت به‌روز شد.");
    const { data: me2 } = await api.me.get();
    if (me2) {
      const m = me2 as {
        id: string;
        name?: string;
        username?: string;
        tokensCount?: number;
        approvedRequestsCount?: number;
        role?: string;
        inviteCode?: string;
        mustChangePassword?: boolean;
      };
      setUser({
        id: m.id,
        passkey: "",
        inviteCode: m.inviteCode ?? "",
        isActivated: true,
        tokensCount: m.tokensCount ?? 0,
        approvedRequestsCount: m.approvedRequestsCount ?? 0,
        role: m.role ?? "user",
        username: m.username,
        name: m.name,
        mustChangePassword: m.mustChangePassword ?? false,
      });
    }
    router.replace(routes.mainMenu);
  };

  if (checking) {
    return (
      <div className="bg-background flex items-center justify-center p-8">
        <p className="text-muted-foreground text-sm">در حال بارگذاری...</p>
      </div>
    );
  }

  return (
    <div className="bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
            <KeyRound className="text-primary h-8 w-8" />
          </div>
          <CardTitle className="text-xl font-bold">تغییر رمز عبور اجباری</CardTitle>
          <CardDescription className="text-xs leading-relaxed">
            حساب شما با رمز اولیه ساخته شده است. برای ادامهٔ استفاده از سامانه باید یک رمز عبور جدید
            و امن انتخاب کنید.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cur-pw">رمز عبور فعلی</Label>
              <InputGroup>
                <InputGroupInput
                  id="cur-pw"
                  type={show ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
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
                    onClick={() => setShow((s) => !s)}
                    aria-label={show ? "مخفی کردن" : "نمایش"}
                  >
                    {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-pw">رمز عبور جدید</Label>
              <InputGroup>
                <InputGroupInput
                  id="new-pw"
                  type={show ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="text-center"
                  dir="ltr"
                  autoComplete="new-password"
                  minLength={PASSWORD_RULES.minLength}
                  required
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    type="button"
                    size="icon-xs"
                    variant="ghost"
                    onClick={() => setShow((s) => !s)}
                    aria-label={show ? "مخفی کردن" : "نمایش"}
                  >
                    {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
              {newPassword.length > 0 && (
                <div className="space-y-1.5">
                  <Progress value={getPasswordStrength(newPassword)} className="h-1.5" />
                  <ul className="text-muted-foreground space-y-0.5 text-xs">
                    {PASSWORD_REQUIREMENTS.map(({ key, label, check }) => (
                      <li key={key} className="flex items-center gap-2">
                        {check(newPassword) ? (
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
              <Label htmlFor="cf-pw">تکرار رمز جدید</Label>
              <Input
                id="cf-pw"
                type={show ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="text-center"
                dir="ltr"
                autoComplete="new-password"
                required
              />
            </div>
            {error && (
              <div className="text-destructive bg-destructive/10 flex items-center gap-2 rounded-lg p-3 text-sm">
                <AlertCircle className="h-5 w-5 shrink-0" />
                {error}
              </div>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={loading || !isPasswordSecure(newPassword) || newPassword !== confirm}
            >
              {loading ? "در حال ذخیره..." : "ثبت رمز جدید و ادامه"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
