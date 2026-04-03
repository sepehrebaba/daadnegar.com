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
import { AlertCircle, KeyRound } from "lucide-react";
import type { User } from "@/types";

function extractErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message) || fallback;
  }
  return fallback;
}

export function PasskeyVerifyScreen() {
  const router = useRouter();
  const { setUser } = useUser();
  const [passkey, setPasskey] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const token = getInviteToken();
    if (!token) {
      setError("لطفاً ابتدا کد دعوت را وارد کنید");
      setIsLoading(false);
      return;
    }

    const { data, error: apiError } = await api.invite.verify.post({ token, passkey });
    if (apiError || !data) {
      setError(extractErrorMessage(apiError, "رمز عبور نادرست است"));
      setIsLoading(false);
      return;
    }
    const result = data as { ok?: boolean; error?: string; user?: User };
    if (!result.ok) {
      setError(result.error ?? "رمز عبور نادرست است");
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
          <div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
            <KeyRound className="text-primary h-8 w-8" />
          </div>
          <CardTitle className="text-foreground text-xl font-bold">ورود به حساب</CardTitle>
          <CardDescription>رمز عبور خود را وارد کنید</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="passkey">رمز عبور</Label>
              <Input
                id="passkey"
                type="password"
                placeholder="رمز عبور خود را وارد کنید"
                value={passkey}
                onChange={(e) => setPasskey(e.target.value)}
                dir="ltr"
              />
            </div>

            {error && (
              <div className="text-destructive bg-destructive/10 flex items-center gap-2 rounded-lg p-3">
                <AlertCircle className="h-5 w-5" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={!passkey || isLoading}>
              {isLoading ? "در حال بررسی..." : "ورود"}
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
