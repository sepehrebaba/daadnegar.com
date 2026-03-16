"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/app-context";
import { routes } from "@/lib/routes";
import { api } from "@/lib/edyen";
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
import { ArrowRight, ArrowLeft, MapPin, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ReportWizardProgress } from "@/components/report-wizard-progress";

export function ReportLocationScreen() {
  const router = useRouter();
  const { updateReport, state } = useApp();
  const [provinces, setProvinces] = useState<
    { id: string; name: string; cities: { id: string; name: string }[] }[]
  >([]);
  const [provinceId, setProvinceId] = useState(state.currentReport?.province ?? "");
  const [cityId, setCityId] = useState(state.currentReport?.city ?? "");
  const [exactLocation, setExactLocation] = useState(state.currentReport?.exactLocation ?? "");

  useEffect(() => {
    api.constants.provinces.get().then(({ data }) => {
      if (data) setProvinces(data as typeof provinces);
    });
  }, []);

  const selectedProvince = provinces.find((p) => p.id === provinceId || p.name === provinceId);
  const cities = selectedProvince?.cities ?? [];

  const isValid = provinceId !== "";

  const handleNext = () => {
    if (isValid) {
      const prov = provinces.find((p) => p.id === provinceId || p.name === provinceId);
      updateReport({
        province: prov?.name ?? provinceId,
        city: cityId || undefined,
        exactLocation: exactLocation || undefined,
      });
      router.push(routes.reportOccurrence);
    }
  };

  return (
    <div className="bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
            <MapPin className="text-primary h-8 w-8" />
          </div>
          <CardTitle className="text-2xl">محل وقوع</CardTitle>
          <CardDescription>محل وقوع این اتفاق را مشخص کنید</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="province">
              استان <span className="text-destructive">*</span>
            </Label>
            <Select
              value={provinceId}
              onValueChange={(v) => {
                setProvinceId(v);
                setCityId("");
              }}
            >
              <SelectTrigger id="province" className="w-full">
                <SelectValue placeholder="انتخاب استان..." />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {provinces.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">شهر (اختیاری)</Label>
            <Select
              value={cityId}
              onValueChange={setCityId}
              disabled={!isValid || cities.length === 0}
            >
              <SelectTrigger id="city" className="w-full">
                <SelectValue placeholder="انتخاب شهر..." />
              </SelectTrigger>
              <SelectContent>
                {cities.map((c) => (
                  <SelectItem key={c.id} value={c.name}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="exact-location">محل دقیق (اختیاری)</Label>
            <Input
              id="exact-location"
              value={exactLocation}
              onChange={(e) => setExactLocation(e.target.value)}
              placeholder="مثال: ساختمان مرکزی، طبقه سوم"
            />
          </div>

          <Alert variant="default" className="border-amber-200 bg-amber-50">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-600" />
            <AlertDescription className="text-amber-800">
              از وارد کردن آدرس منزل یا اطلاعات شخصی خودداری کنید.
            </AlertDescription>
          </Alert>

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
          <ReportWizardProgress step={5} total={8} />
        </CardContent>
      </Card>
    </div>
  );
}
