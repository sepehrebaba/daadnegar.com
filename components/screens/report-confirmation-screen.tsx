"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/app-context";
import { routes } from "@/lib/routes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowRight, CheckCircle, Shield } from "lucide-react";

export function ReportConfirmationScreen() {
  const router = useRouter();
  const { updateReport, submitReport, state } = useApp();
  const [confirmAccuracy, setConfirmAccuracy] = useState(false);
  const [confirmNoPersonalInfo, setConfirmNoPersonalInfo] = useState(false);
  const [confirmProcessAgreement, setConfirmProcessAgreement] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid = confirmAccuracy && confirmNoPersonalInfo && confirmProcessAgreement;

  const handleSubmit = async () => {
    if (!isValid) return;
    setIsSubmitting(true);
    updateReport({
      confirmAccuracy,
      confirmNoPersonalInfo,
      confirmProcessAgreement,
    });
    try {
      await submitReport();
      router.push(routes.reportSuccess);
    } catch {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
            <Shield className="text-primary h-8 w-8" />
          </div>
          <CardTitle className="text-2xl">تایید نهایی</CardTitle>
          <CardDescription>لطفاً موارد زیر را تایید کنید</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted/50 space-y-2 rounded-lg p-4">
            <h3 className="text-sm font-semibold">خلاصه گزارش:</h3>
            <p className="text-sm">
              <span className="text-muted-foreground">عنوان:</span>{" "}
              {state.currentReport?.title || "-"}
            </p>
            <p className="text-sm">
              <span className="text-muted-foreground">استان:</span>{" "}
              {state.currentReport?.province || "-"}
            </p>
          </div>

          <div className="flex items-start space-x-3 space-x-reverse rounded-lg border p-4">
            <Checkbox
              id="confirm-accuracy"
              checked={confirmAccuracy}
              onCheckedChange={(c) => setConfirmAccuracy(c as boolean)}
              className="mt-1"
            />
            <div className="space-y-1">
              <Label htmlFor="confirm-accuracy" className="cursor-pointer font-medium">
                تایید صحت اطلاعات <span className="text-destructive">*</span>
              </Label>
              <p className="text-muted-foreground text-sm">
                تایید می‌کنم اطلاعاتی که وارد کرده‌ام تا حدی که می‌دانم صحیح است.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3 space-x-reverse rounded-lg border p-4">
            <Checkbox
              id="confirm-no-personal"
              checked={confirmNoPersonalInfo}
              onCheckedChange={(c) => setConfirmNoPersonalInfo(c as boolean)}
              className="mt-1"
            />
            <div className="space-y-1">
              <Label htmlFor="confirm-no-personal" className="cursor-pointer font-medium">
                عدم وارد کردن اطلاعات شخصی خطرناک <span className="text-destructive">*</span>
              </Label>
              <p className="text-muted-foreground text-sm">
                تایید می‌کنم اطلاعات شخصی غیرضروری یا محتوای خطرناک وارد نکرده‌ام.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3 space-x-reverse rounded-lg border p-4">
            <Checkbox
              id="confirm-process"
              checked={confirmProcessAgreement}
              onCheckedChange={(c) => setConfirmProcessAgreement(c as boolean)}
              className="mt-1"
            />
            <div className="space-y-1">
              <Label htmlFor="confirm-process" className="cursor-pointer font-medium">
                پذیرش فرایند بررسی گزارش <span className="text-destructive">*</span>
              </Label>
              <p className="text-muted-foreground text-sm">
                می‌پذیرم که گزارش ممکن است بررسی، رد یا برای اصلاح بازگردانده شود.
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="flex-1"
              disabled={isSubmitting}
            >
              <ArrowRight className="ml-2 h-4 w-4" />
              بازگشت
            </Button>
            <Button onClick={handleSubmit} disabled={!isValid || isSubmitting} className="flex-1">
              {isSubmitting ? (
                "در حال ارسال..."
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  ارسال گزارش
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
