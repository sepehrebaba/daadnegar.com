"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useReport } from "@/context/report-context";
import { routes } from "@/lib/routes";
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
import { ReportWizardProgress } from "@/components/report-wizard-progress";
import { ORGANIZATION_TYPES, type OrganizationType } from "@/types";

export function ReportOrganizationScreen() {
  const router = useRouter();
  const { updateReport, currentReport } = useReport();
  const [organizationType, setOrganizationType] = useState<OrganizationType | "">(
    (currentReport?.organizationType as OrganizationType) || "",
  );
  const [organizationName, setOrganizationName] = useState(currentReport?.organizationName || "");

  const isValid = organizationType !== "";

  const handleNext = () => {
    if (isValid) {
      updateReport({
        organizationType: organizationType as OrganizationType,
        organizationName: organizationName || undefined,
      });
      router.push(routes.reportPerson);
    }
  };

  return (
    <div className="bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
            <Building2 className="text-primary h-8 w-8" />
          </div>
          <CardTitle className="text-2xl">نهاد یا سازمان مرتبط</CardTitle>
          <CardDescription>نوع نهاد یا سازمان مرتبط با گزارش را مشخص کنید</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="org-type">
              نوع نهاد یا سازمان <span className="text-destructive">*</span>
            </Label>
            <Select
              value={organizationType}
              onValueChange={(v) => setOrganizationType(v as OrganizationType)}
            >
              <SelectTrigger id="org-type" className="w-full">
                <SelectValue placeholder="انتخاب نوع نهاد..." />
              </SelectTrigger>
              <SelectContent>
                {ORGANIZATION_TYPES.map((org) => (
                  <SelectItem key={org.value} value={org.value}>
                    {org.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="org-name">
              نام دقیق نهاد یا سازمان <span className="text-muted-foreground">(اختیاری)</span>
            </Label>
            <Input
              id="org-name"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              placeholder="مثال: شهرداری منطقه ۵ تهران"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => router.back()} className="flex-1">
              <ArrowRight className="ml-2 h-4 w-4" />
              بازگشت
            </Button>
            <Button onClick={handleNext} disabled={!isValid} className="flex-1">
              مرحله بعد
              <ArrowLeft className="mr-2 h-4 w-4" />
            </Button>
          </div>

          <ReportWizardProgress step={3} total={8} />
        </CardContent>
      </Card>
    </div>
  );
}
