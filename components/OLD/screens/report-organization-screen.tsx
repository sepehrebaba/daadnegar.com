"use client";

import { useState } from "react";
import { useApp } from "@/context/app-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowRight, ArrowLeft, Building2 } from "lucide-react";
import { ORGANIZATION_TYPES, type OrganizationType } from "@/types";

export function ReportOrganizationScreen() {
  const { navigate, goBack, updateReport, state } = useApp();
  const [organizationType, setOrganizationType] = useState<OrganizationType | "">(
    (state.currentReport?.organizationType as OrganizationType) || "",
  );
  const [organizationName, setOrganizationName] = useState(
    state.currentReport?.organizationName || "",
  );

  const isValid = organizationType !== "";

  const handleNext = () => {
    if (isValid) {
      console.log("[v0] Report organization set:", { organizationType, organizationName });
      updateReport({
        organizationType: organizationType as OrganizationType,
        organizationName: organizationName || undefined,
      });
      navigate("report-person");
    }
  };

  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
            <Building2 className="text-primary h-8 w-8" />
          </div>
          <CardTitle className="text-2xl">نهاد یا سازمان مرتبط</CardTitle>
          <CardDescription>نوع نهاد یا سازمان مرتبط با گزارش را مشخص کنید</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* نوع نهاد */}
          <div className="space-y-2">
            <Label htmlFor="org-type">
              نوع نهاد یا سازمان <span className="text-destructive">*</span>
            </Label>
            <Select
              value={organizationType}
              onValueChange={(value) => {
                setOrganizationType(value as OrganizationType);
                console.log("[v0] Organization type changed to:", value);
              }}
            >
              <SelectTrigger id="org-type" className="w-full text-right">
                <SelectValue placeholder="انتخاب نوع نهاد..." />
              </SelectTrigger>
              <SelectContent align="end" className="text-right">
                {ORGANIZATION_TYPES.map((org) => (
                  <SelectItem key={org.value} value={org.value} className="justify-end">
                    {org.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* نام دقیق نهاد */}
          <div className="space-y-2">
            <Label htmlFor="org-name">
              نام دقیق نهاد یا سازمان <span className="text-muted-foreground">(اختیاری)</span>
            </Label>
            <Input
              id="org-name"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              placeholder="مثال: شهرداری منطقه ۵ تهران"
              dir="rtl"
            />
          </div>

          {/* دکمه‌ها */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={goBack} className="flex-1">
              <ArrowRight className="ml-2 h-4 w-4" />
              بازگشت
            </Button>
            <Button onClick={handleNext} disabled={!isValid} className="flex-1">
              مرحله بعد
              <ArrowLeft className="mr-2 h-4 w-4" />
            </Button>
          </div>

          {/* نوار پیشرفت */}
          <div className="flex items-center justify-center gap-2 pt-2">
            <div className="bg-primary h-3 w-3 rounded-full" />
            <div className="bg-primary h-3 w-3 rounded-full" />
            <div className="bg-primary h-3 w-3 rounded-full" />
            <div className="bg-muted h-3 w-3 rounded-full" />
            <div className="bg-muted h-3 w-3 rounded-full" />
            <div className="bg-muted h-3 w-3 rounded-full" />
            <div className="bg-muted h-3 w-3 rounded-full" />
            <div className="bg-muted h-3 w-3 rounded-full" />
          </div>
          <p className="text-muted-foreground text-center text-sm">مرحله ۳ از ۸</p>
        </CardContent>
      </Card>
    </div>
  );
}
