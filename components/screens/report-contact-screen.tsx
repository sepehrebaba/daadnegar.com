"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useReport } from "@/context/report-context";
import { routes } from "@/lib/routes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ArrowRight, ArrowLeft, Phone, Mail, Link, Check, X } from "lucide-react";
import { ReportWizardProgress } from "@/components/report-wizard-progress";
import { useTranslation } from "react-i18next";

export function ReportContactScreen() {
  const router = useRouter();
  const { updateReport, currentReport } = useReport();
  const { t } = useTranslation();
  const [wantsContact, setWantsContact] = useState<"yes" | "no">(
    currentReport?.wantsContact ? "yes" : "no",
  );
  const [email, setEmail] = useState(currentReport?.contactEmail ?? "");
  const [phone, setPhone] = useState(currentReport?.contactPhone ?? "");
  const [social, setSocial] = useState(currentReport?.contactSocial ?? "");

  const handleNext = () => {
    updateReport({
      wantsContact: wantsContact === "yes",
      contactEmail: wantsContact === "yes" && email ? email : undefined,
      contactPhone: wantsContact === "yes" && phone ? phone : undefined,
      contactSocial: wantsContact === "yes" && social ? social : undefined,
    });
    router.push(routes.reportConfirmation);
  };

  return (
    <div className="bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
            <Phone className="text-primary h-8 w-8" />
          </div>
          <CardTitle className="text-2xl">{t("report.contact.title")}</CardTitle>
          <CardDescription>{t("report.contact.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setWantsContact("yes")}
              className={`relative flex flex-col items-center gap-3 rounded-xl border-2 p-4 transition-all duration-200 ${
                wantsContact === "yes"
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border hover:border-primary/50 hover:bg-muted/50"
              }`}
            >
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-full ${
                  wantsContact === "yes" ? "bg-primary/20" : "bg-muted"
                }`}
              >
                <Check
                  className={`h-6 w-6 ${wantsContact === "yes" ? "text-primary" : "text-muted-foreground"}`}
                />
              </div>
              <span
                className={`font-medium ${wantsContact === "yes" ? "text-primary" : "text-foreground"}`}
              >
                {t("common.yes")}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setWantsContact("no");
                setEmail("");
                setPhone("");
                setSocial("");
              }}
              className={`relative flex flex-col items-center gap-3 rounded-xl border-2 p-4 transition-all duration-200 ${
                wantsContact === "no"
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border hover:border-primary/50 hover:bg-muted/50"
              }`}
            >
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-full ${
                  wantsContact === "no" ? "bg-primary/20" : "bg-muted"
                }`}
              >
                <X
                  className={`h-6 w-6 ${wantsContact === "no" ? "text-primary" : "text-muted-foreground"}`}
                />
              </div>
              <span
                className={`font-medium ${wantsContact === "no" ? "text-primary" : "text-foreground"}`}
              >
                {t("common.no")}
              </span>
            </button>
          </div>

          {wantsContact === "yes" && (
            <div className="bg-muted/50 space-y-4 rounded-lg p-4">
              <p className="text-muted-foreground text-sm">{t("report.contact.optionalNote")}</p>
              <div className="space-y-2">
                <Label htmlFor="email">{t("report.contact.email")}</Label>
                <div className="relative">
                  <Mail className="text-muted-foreground absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@email.com"
                    className="pr-10"
                    dir="ltr"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">{t("report.contact.phone")}</Label>
                <div className="relative">
                  <Phone className="text-muted-foreground absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2" />
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="09123456789"
                    className="pr-10"
                    dir="ltr"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="social">{t("report.contact.social")}</Label>
                <div className="relative">
                  <Link className="text-muted-foreground absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2" />
                  <Input
                    id="social"
                    type="url"
                    value={social}
                    onChange={(e) => setSocial(e.target.value)}
                    placeholder="https://..."
                    className="pr-10"
                    dir="ltr"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => router.back()} className="flex-1">
              <ArrowRight className="ml-2 h-4 w-4" />
              {t("common.back")}
            </Button>
            <Button onClick={handleNext} className="flex-1">
              {t("common.next")}
              <ArrowLeft className="mr-2 h-4 w-4" />
            </Button>
          </div>
          <ReportWizardProgress step={8} total={8} />
        </CardContent>
      </Card>
    </div>
  );
}
