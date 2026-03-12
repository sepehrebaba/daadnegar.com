"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/app-context";
import { routes } from "@/lib/routes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertCircle, FileText, Upload, X } from "lucide-react";

export function ReportDocumentsScreen() {
  const router = useRouter();
  const { setReportDocuments } = useApp();
  const [documents, setDocuments] = useState<{ name: string; url: string }[]>([]);
  const [error, setError] = useState("");

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      console.log("[v0] User uploading documents:", files.length, "files");
      const newDocs = Array.from(files).map((file) => {
        // TODO: Upload to server and get URL
        const url = URL.createObjectURL(file);
        console.log("[v0] Document preview created:", file.name);
        return { name: file.name, url };
      });
      setDocuments((prev) => [...prev, ...newDocs]);
    }
  };

  const handleRemoveDocument = (index: number) => {
    console.log("[v0] Removing document at index:", index);
    setDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (documents.length === 0) {
      setError("حداقل یک سند باید آپلود شود");
      return;
    }

    console.log("[v0] Setting report documents:", documents);
    setReportDocuments(documents.map((d) => d.url));
    router.push(routes.reportDescription);
  };

  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-foreground text-xl font-bold">مرحله ۳: آپلود اسناد</CardTitle>
          <CardDescription>اسناد و مدارک مربوط به گزارش خود را آپلود کنید</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-border rounded-lg border-2 border-dashed p-6 text-center">
            <label className="cursor-pointer">
              <div className="bg-primary/10 mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full">
                <Upload className="text-primary h-8 w-8" />
              </div>
              <span className="text-foreground text-sm font-medium">
                کلیک کنید یا فایل‌ها را بکشید
              </span>
              <p className="text-muted-foreground mt-1 text-xs">PDF, تصویر یا سایر فرمت‌ها</p>
              <input
                type="file"
                accept="*/*"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {documents.length > 0 && (
            <div className="space-y-2">
              <p className="text-foreground text-sm font-medium">
                فایل‌های آپلود شده ({documents.length})
              </p>
              {documents.map((doc, index) => (
                <div key={index} className="bg-secondary flex items-center gap-3 rounded-lg p-3">
                  <FileText className="text-primary h-5 w-5 flex-shrink-0" />
                  <span className="flex-1 truncate text-sm">{doc.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveDocument(index)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="text-destructive bg-destructive/10 flex items-center gap-2 rounded-lg p-3">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <Button onClick={handleSubmit} className="w-full">
            ادامه
          </Button>

          <Button onClick={() => router.back()} variant="ghost" className="w-full">
            بازگشت
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
