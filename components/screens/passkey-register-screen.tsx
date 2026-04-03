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

function extractErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message) || fallback;
  }
  return fallback;
}

export function PasskeyRegisterScreen() {
  const router = useRouter();
  const { setUser } = useUser();
  const [passkey, setPasskey] = useState("");
  const [confirmPasskey, setConfirmPasskey] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (passkey.length < 6) {
      setError("رمز عبور باید حداقل ۶ کاراکتر باشد");
      return;
    }

    if (passkey !== confirmPasskey) {
      setError("رمزهای عبور مطابقت ندارند");
      return;
    }

    setIsLoading(true);

    const token = getInviteToken();
    if (!token) {
      setError("لطفاً ابتدا کد دعوت را وارد کنید");
      setIsLoading(false);
      return;
    }

    const { data, error: apiError } = await api.invite.register.post({ token, passkey });
    if (apiError || !data) {
      setError(extractErrorMessage(apiError, "خطا در ثبت رمز عبور"));
      setIsLoading(false);
      return;
    }
    const result = data as { ok?: boolean; error?: string; user?: User };
    if (!result.ok) {
      setError(result.error ?? "خطا در ثبت رمز عبور");
      setIsLoading(false);
      return;
    }
    if (!result.user) {
      setError("خطا در دریافت اطلاعات کاربر");
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
          <CardTitle className="text-foreground text-xl font-bold">ایجاد کلید امنیتی</CardTitle>
          <CardDescription>یک رمز عبور امن برای دسترسی به حساب خود ایجاد کنید</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="passkey">رمز عبور</Label>
              <Input
                id="passkey"
                type="password"
                placeholder="حداقل ۶ کاراکتر"
                value={passkey}
                onChange={(e) => setPasskey(e.target.value)}
                dir="ltr"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm">تکرار رمز عبور</Label>
              <Input
                id="confirm"
                type="password"
                placeholder="رمز عبور را دوباره وارد کنید"
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
              {isLoading ? "در حال ثبت..." : "ثبت و ورود"}
            </Button>

            <Button type="button" onClick={() => router.back()} variant="ghost" className="w-full">
              بازگشت
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
