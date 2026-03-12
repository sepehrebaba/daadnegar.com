"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/app-context";
import { routes } from "@/lib/routes";
import { api } from "@/lib/edyen";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Upload, User } from "lucide-react";

export function ReportManualEntryScreen() {
  const router = useRouter();
  const { setReportPerson } = useApp();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [nationalCode, setNationalCode] = useState("");
  const [personImage, setPersonImage] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log("[v0] User uploading person image:", file.name);
      // TODO: Upload to server and get URL
      setPersonImage(URL.createObjectURL(file));
      console.log("[v0] Person image preview created");
    }
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!firstName || !lastName) {
      setError("نام و نام خانوادگی الزامی است");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await api.people.post({
        firstName,
        lastName,
        nationalCode: nationalCode || undefined,
        imageUrl: personImage && personImage.startsWith("http") ? personImage : undefined,
      });
      if (error) throw new Error(String(error));
      if (data) {
        setReportPerson({ ...data, isFamous: false });
        router.push(routes.reportDocuments);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در ثبت اطلاعات");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-foreground text-xl font-bold">ورود اطلاعات فرد</CardTitle>
          <CardDescription>مشخصات فرد مورد نظر را وارد کنید</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">نام *</Label>
              <Input
                id="firstName"
                placeholder="نام"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">نام خانوادگی *</Label>
              <Input
                id="lastName"
                placeholder="نام خانوادگی"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nationalCode">کد ملی (اختیاری)</Label>
              <Input
                id="nationalCode"
                placeholder="کد ملی ۱۰ رقمی"
                value={nationalCode}
                onChange={(e) => setNationalCode(e.target.value)}
                dir="ltr"
                maxLength={10}
              />
            </div>

            <div className="space-y-2">
              <Label>تصویر فرد (اختیاری)</Label>
              <div className="border-border rounded-lg border-2 border-dashed p-6 text-center">
                {personImage ? (
                  <div className="space-y-2">
                    <div className="bg-muted mx-auto h-24 w-24 overflow-hidden rounded-full">
                      <img src={personImage} alt="Preview" className="h-full w-full object-cover" />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setPersonImage(null)}
                    >
                      حذف تصویر
                    </Button>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <div className="bg-muted mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full">
                      <User className="text-muted-foreground h-8 w-8" />
                    </div>
                    <span className="text-muted-foreground flex items-center justify-center gap-2 text-sm">
                      <Upload className="h-4 w-4" />
                      آپلود تصویر
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {error && (
              <div className="text-destructive bg-destructive/10 flex items-center gap-2 rounded-lg p-3">
                <AlertCircle className="h-5 w-5" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "در حال ثبت..." : "ادامه"}
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
