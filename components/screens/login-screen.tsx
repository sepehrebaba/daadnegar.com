"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/app-context";
import { routes } from "@/lib/routes";
import { getAppBaseUrl } from "@/lib/app-base-url";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, LogIn } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/edyen";

export function LoginScreen() {
  const router = useRouter();
  const { setUser } = useApp();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
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
      let msg = "خطا در ورود. لطفاً اطلاعات را بررسی کنید.";
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
    toast(mustChange ? "وارد شدید؛ لطفاً رمز عبور خود را عوض کنید." : "با موفقیت وارد شدید!");
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
          <CardTitle className="text-foreground text-xl font-bold">ورود به حساب کاربری</CardTitle>
          <CardDescription className="text-xs">
            نام کاربری یا ایمیل ثبت‌شده و رمز عبور را وارد کنید. اگر حساب قدیمی با دعوت دارید، نام
            کاربری ممکن است با <span dir="ltr">dn_</span> شروع شود (همان را کامل بنویسید، نه فقط کد
            دعوت).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">نام کاربری یا ایمیل</Label>
              <Input
                id="username"
                type="text"
                autoComplete="username"
                placeholder="my_username یا user@…"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="text-center"
                dir="ltr"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">رمز عبور</Label>
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

            <Button
              type="submit"
              className="w-full"
              disabled={!username.trim() || !password || isLoading}
            >
              {isLoading ? "در حال ورود..." : "ورود"}
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
