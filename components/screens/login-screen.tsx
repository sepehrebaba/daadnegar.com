"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/app-context";
import { routes } from "@/lib/routes";
import { authClient } from "@/lib/auth-client";
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const { data, error: signInError } = await authClient.signIn.email({
      email,
      password,
      rememberMe: true,
    });

    if (signInError) {
      setError(signInError.message || "خطا در ورود. لطفاً اطلاعات را بررسی کنید.");
      setIsLoading(false);
      return;
    }

    console.log(data);

    if (data?.user) {
      const { data: me, error: meError } = await api.me.get();

      console.log("====me", me);
      if (meError || !me) {
        // redirect to login page
        router.push(routes.login);
        return;
      } else {
        setUser({
          id: me.id,
          passkey: "",
          inviteCode: "",
          isActivated: true,
          tokensCount: me.tokensCount ?? 0,
          approvedRequestsCount: me.approvedRequestsCount ?? 0,
          email: me.email,
          name: me.name,
        });
      }
      toast("با موفقیت وارد شدید!");
      router.push(routes.mainMenu);
    } else {
      setError("ورود با خطا مواجه شد. لطفاً دوباره تلاش کنید.");
    }

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
          <CardDescription>
            ایمیل و رمز عبور خود را وارد کنید. برای عضویت نیاز به دعوت‌نامه دارید.
          </CardDescription>
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

            <Button type="submit" className="w-full" disabled={!email || !password || isLoading}>
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
