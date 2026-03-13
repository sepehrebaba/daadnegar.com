"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/app-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Languages, LogOut, Settings } from "lucide-react";
import { routes } from "@/lib/routes";
import { authClient } from "@/lib/auth-client";
import { api, DADBAN_INVITE_TOKEN_KEY, clearInviteTokenStorage } from "@/lib/edyen";

export function SettingsScreen() {
  const router = useRouter();
  const { state, setLanguage, setUser } = useApp();
  const user = state.user;

  const hasAuth =
    typeof window !== "undefined" &&
    (localStorage.getItem(DADBAN_INVITE_TOKEN_KEY) || document.cookie.includes("better-auth"));

  // بارگذاری کاربر هنگام رفرش یا ورود مستقیم
  useEffect(() => {
    if (user) return;
    if (!hasAuth) {
      router.replace(routes.home);
      return;
    }
    let cancelled = false;
    api.me.get().then(({ data, error }) => {
      if (cancelled || error || !data) {
        if (!cancelled) router.replace(routes.home);
        return;
      }
      setUser({
        id: data.id,
        passkey: "",
        inviteCode: data.inviteCode ?? "",
        isActivated: true,
        tokensCount: data.tokensCount ?? 0,
        approvedRequestsCount: data.approvedRequestsCount ?? 0,
      } as Parameters<typeof setUser>[0]);
    });
    return () => {
      cancelled = true;
    };
  }, [user, setUser, hasAuth, router]);

  useEffect(() => {
    if (!user && !hasAuth) router.replace(routes.home);
  }, [user, hasAuth, router]);

  const handleLogout = async () => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem(DADBAN_INVITE_TOKEN_KEY) : null;
    if (token) {
      await fetch("/api/me/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });
    }
    await authClient.signOut();
    if (typeof window !== "undefined") {
      clearInviteTokenStorage();
    }
    setUser(null);
    router.push(routes.home);
  };

  if (!user && !hasAuth) return null;
  if (!user)
    return <div className="flex min-h-[200px] items-center justify-center">در حال بارگذاری...</div>;

  return (
    <div className="bg-background flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
            <Settings className="text-primary h-8 w-8" />
          </div>
          <CardTitle className="text-foreground text-2xl font-bold">تنظیمات</CardTitle>
          <CardDescription>مدیریت تنظیمات حساب کاربری</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="space-y-3">
            <h3 className="text-foreground text-sm font-medium">زبان</h3>
            <div className="flex gap-2">
              <Button
                variant={state.language === "fa" ? "default" : "outline"}
                className="flex-1 gap-2"
                onClick={() => setLanguage("fa")}
              >
                <Languages className="h-4 w-4" />
                فارسی
              </Button>
              <Button
                variant={state.language === "en" ? "default" : "outline"}
                className="flex-1 gap-2"
                onClick={() => setLanguage("en")}
              >
                <Languages className="h-4 w-4" />
                English
              </Button>
            </div>
          </div>

          <div className="border-border my-2 border-t" />

          <Button onClick={handleLogout} variant="destructive" className="w-full gap-2">
            <LogOut className="h-4 w-4" />
            خروج از حساب
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
