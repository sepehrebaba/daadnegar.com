"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, setInviteTokenStorage } from "@/lib/edyen";
import { routes } from "@/lib/routes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, KeyRound } from "lucide-react";

function extractErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message) || fallback;
  }
  return fallback;
}

export function InviteCodeScreen() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const { data, error: apiError } = await api.invite.validate.post({ code });
    if (apiError || !data) {
      setError(extractErrorMessage(apiError, "کد دعوت نامعتبر است"));
      setIsLoading(false);
      return;
    }
    const result = data as { ok?: boolean; error?: string; token?: string; hasPasskey?: boolean };
    if (!result.ok) {
      setError(result.error ?? "کد دعوت نامعتبر است");
      setIsLoading(false);
      return;
    }
    setInviteTokenStorage(result.token);
    router.push(`${routes.register}?code=${encodeURIComponent(code)}`);

    setIsLoading(false);
  };

  return (
    <div className="bg-background flex items-center justify-center p-4">
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

            <Button type="button" onClick={() => router.back()} variant="ghost" className="w-full">
              بازگشت
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
