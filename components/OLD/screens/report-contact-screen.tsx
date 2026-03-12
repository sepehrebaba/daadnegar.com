"use client";

import { useState } from "react";
import { useApp } from "@/context/app-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowRight, ArrowLeft, Phone, Mail, Link } from "lucide-react";

export function ReportContactScreen() {
  const { navigate, goBack, updateReport, state } = useApp();
  const [wantsContact, setWantsContact] = useState<"yes" | "no">(
    state.currentReport?.wantsContact ? "yes" : "no",
  );
  const [email, setEmail] = useState(state.currentReport?.contactEmail || "");
  const [phone, setPhone] = useState(state.currentReport?.contactPhone || "");
  const [social, setSocial] = useState(state.currentReport?.contactSocial || "");

  const handleNext = () => {
    console.log("[v0] Report contact set:", { wantsContact, email, phone, social });
    updateReport({
      wantsContact: wantsContact === "yes",
      contactEmail: wantsContact === "yes" && email ? email : undefined,
      contactPhone: wantsContact === "yes" && phone ? phone : undefined,
      contactSocial: wantsContact === "yes" && social ? social : undefined,
    });
    navigate("report-confirmation");
  };

  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
            <Phone className="text-primary h-8 w-8" />
          </div>
          <CardTitle className="text-2xl">تمایل به تماس</CardTitle>
          <CardDescription>آیا مایل هستید در صورت نیاز با شما تماس گرفته شود؟</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* تمایل به تماس */}
          <RadioGroup
            value={wantsContact}
            onValueChange={(value) => {
              setWantsContact(value as "yes" | "no");
              if (value === "no") {
                setEmail("");
                setPhone("");
                setSocial("");
              }
              console.log("[v0] Wants contact changed to:", value);
            }}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2 space-x-reverse">
              <RadioGroupItem value="yes" id="contact-yes" />
              <Label htmlFor="contact-yes" className="cursor-pointer">
                بله
              </Label>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <RadioGroupItem value="no" id="contact-no" />
              <Label htmlFor="contact-no" className="cursor-pointer">
                خیر
              </Label>
            </div>
          </RadioGroup>

          {wantsContact === "yes" && (
            <div className="bg-muted/50 space-y-4 rounded-lg p-4">
              <p className="text-muted-foreground text-sm">
                تمام فیلدهای زیر اختیاری هستند. حداقل یک روش تماس وارد کنید.
              </p>

              {/* ایمیل */}
              <div className="space-y-2">
                <Label htmlFor="email">ایمیل</Label>
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

              {/* شماره تلفن */}
              <div className="space-y-2">
                <Label htmlFor="phone">شماره تلفن</Label>
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

              {/* لینک شبکه اجتماعی */}
              <div className="space-y-2">
                <Label htmlFor="social">لینک شبکه اجتماعی</Label>
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

          {/* دکمه‌ها */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={goBack} className="flex-1">
              <ArrowRight className="ml-2 h-4 w-4" />
              بازگشت
            </Button>
            <Button onClick={handleNext} className="flex-1">
              مرحله بعد
              <ArrowLeft className="mr-2 h-4 w-4" />
            </Button>
          </div>

          {/* نوار پیشرفت */}
          <div className="flex items-center justify-center gap-2 pt-2">
            <div className="bg-primary h-3 w-3 rounded-full" />
            <div className="bg-primary h-3 w-3 rounded-full" />
            <div className="bg-primary h-3 w-3 rounded-full" />
            <div className="bg-primary h-3 w-3 rounded-full" />
            <div className="bg-primary h-3 w-3 rounded-full" />
            <div className="bg-primary h-3 w-3 rounded-full" />
            <div className="bg-primary h-3 w-3 rounded-full" />
            <div className="bg-primary h-3 w-3 rounded-full" />
          </div>
          <p className="text-muted-foreground text-center text-sm">مرحله ۸ از ۸</p>
        </CardContent>
      </Card>
    </div>
  );
}
