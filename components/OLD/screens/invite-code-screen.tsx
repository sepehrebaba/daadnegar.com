"use client";

import { useState } from "react";
import { useApp } from "@/context/app-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, KeyRound } from "lucide-react";

export function InviteCodeScreen() {
  const { navigate, verifyInviteCode, goBack } = useApp();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    console.log("[v0] User submitting invite code:", code);

    // شبیه‌سازی تاخیر شبکه
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (verifyInviteCode(code)) {
      console.log("[v0] Invite code valid, checking if passkey exists");
      // TODO: API call to check if user already has passkey
      const existingPasskey = localStorage.getItem("najva_passkey");

      if (existingPasskey) {
        console.log("[v0] Existing passkey found, redirecting to verify");
        navigate("passkey-verify");
      } else {
        console.log("[v0] No passkey found, redirecting to register");
        navigate("passkey-register");
      }
    } else {
      console.log("[v0] Invalid invite code");
      setError("کد دعوت نامعتبر است");
    }

    setIsLoading(false);
  };

  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
            <KeyRound className="text-primary h-8 w-8" />
          </div>
          <CardTitle className="text-foreground text-xl font-bold">کد دعوت را وارد کنید</CardTitle>
          <CardDescription>کد دعوت خود را وارد نمایید: INVITE2024</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">کد دعوت</Label>
              <Input
                id="code"
                type="text"
                placeholder="مثال: INVITE2024"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="text-center text-lg tracking-wider"
                dir="ltr"
              />
            </div>

            {error && (
              <div className="text-destructive bg-destructive/10 flex items-center gap-2 rounded-lg p-3">
                <AlertCircle className="h-5 w-5" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={!code || isLoading}>
              {isLoading ? "در حال بررسی..." : "ادامه"}
            </Button>

            <Button type="button" onClick={goBack} variant="ghost" className="w-full">
              بازگشت
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
