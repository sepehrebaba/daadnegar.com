"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useReport } from "@/context/report-context";
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
import { useTranslation } from "react-i18next";

export function ReportLocationScreen() {
  const router = useRouter();
  const { updateReport, currentReport } = useReport();
  const { t } = useTranslation();
  const [provinces, setProvinces] = useState<
    { id: string; name: string; cities: { id: string; name: string }[] }[]
  >([]);
  const [provinceId, setProvinceId] = useState(currentReport?.province ?? "");
  const [cityId, setCityId] = useState(currentReport?.city ?? "");
  const [exactLocation, setExactLocation] = useState(currentReport?.exactLocation ?? "");

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
          <CardTitle className="text-2xl">{t("report.location.title")}</CardTitle>
          <CardDescription>{t("report.location.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="province">
              {t("report.location.province")} <span className="text-destructive">*</span>
            </Label>
            <Select
              value={provinceId}
              onValueChange={(v) => {
                setProvinceId(v);
                setCityId("");
              }}
            >
              <SelectTrigger id="province" className="w-full">
                <SelectValue placeholder={t("report.location.selectProvince")} />
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
            <Label htmlFor="city">{t("report.location.city")}</Label>
            <Select
              value={cityId}
              onValueChange={setCityId}
              disabled={!isValid || cities.length === 0}
            >
              <SelectTrigger id="city" className="w-full">
                <SelectValue placeholder={t("report.location.selectCity")} />
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
            <Label htmlFor="exact-location">{t("report.location.exactLocation")}</Label>
            <Input
              id="exact-location"
              value={exactLocation}
              onChange={(e) => setExactLocation(e.target.value)}
              placeholder={t("report.location.exactLocationPlaceholder")}
            />
          </div>

          <Alert variant="default" className="border-amber-200 bg-amber-50">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-600" />
            <AlertDescription className="text-amber-800">
              {t("report.location.warning")}
            </AlertDescription>
          </Alert>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => router.back()} className="flex-1">
              <ArrowRight className="ml-2 h-4 w-4" />
              {t("common.back")}
            </Button>
            <Button onClick={handleNext} disabled={!isValid} className="flex-1">
              {t("common.next")}
              <ArrowLeft className="mr-2 h-4 w-4" />
            </Button>
          </div>
          <ReportWizardProgress step={5} total={8} />
        </CardContent>
      </Card>
    </div>
  );
}
