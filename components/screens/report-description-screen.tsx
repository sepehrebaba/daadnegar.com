"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/app-context";
import { routes } from "@/lib/routes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";

export function ReportDescriptionScreen() {
  const router = useRouter();
  const { setReportDescription } = useApp();
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (description.length < 50) {
      setError("توضیحات باید حداقل ۵۰ کاراکتر باشد");
      return;
    }

    setIsLoading(true);
    console.log("[v0] Setting report description:", description.substring(0, 50) + "...");
    setReportDescription(description);

    // TODO: API call to save report in DB
    console.log("[v0] Saving report to database...");
    await new Promise((resolve) => setTimeout(resolve, 500));
    console.log("[v0] Report saved successfully");

    router.push(routes.reportSuccess);
    setIsLoading(false);
  };

  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-foreground text-xl font-bold">مرحله ۴: شرح مشکل</CardTitle>
          <CardDescription>توضیحات کاملی درباره گزارش خود بنویسید</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">توضیحات</Label>
            <Textarea
              id="description"
              placeholder="لطفا جزئیات کامل گزارش خود را اینجا بنویسید..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={8}
              className="resize-none"
            />
            <p className="text-muted-foreground text-left text-xs" dir="ltr">
              {description.length} / 50+ characters
            </p>
          </div>

          {error && (
            <div className="text-destructive bg-destructive/10 flex items-center gap-2 rounded-lg p-3">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <Button onClick={handleSubmit} className="w-full" disabled={isLoading}>
            {isLoading ? "در حال ارسال..." : "ارسال گزارش"}
          </Button>

          <Button
            onClick={() => router.back()}
            variant="ghost"
            className="w-full"
            disabled={isLoading}
          >
            بازگشت
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
