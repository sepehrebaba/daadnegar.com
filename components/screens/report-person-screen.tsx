"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/app-context";
import { routes } from "@/lib/routes";
import { api } from "@/lib/edyen";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  User,
  Search,
  AlertTriangle,
  UserPlus,
  Check,
  X,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { ReportWizardProgress } from "@/components/report-wizard-progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Person } from "@/types";

export function ReportPersonScreen() {
  const router = useRouter();
  const { updateReport, state, getFamousPeople, setReportPerson } = useApp();
  const [hasInvolvedPerson, setHasInvolvedPerson] = useState<"yes" | "no" | "">(
    state.currentReport?.hasInvolvedPerson === true
      ? "yes"
      : state.currentReport?.hasInvolvedPerson === false
        ? "no"
        : "",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(
    state.currentReport?.involvedPerson || state.currentReport?.person || null,
  );
  const [showAddNew, setShowAddNew] = useState(false);
  const [newPersonFirstName, setNewPersonFirstName] = useState("");
  const [newPersonLastName, setNewPersonLastName] = useState("");
  const [famousPeople, setFamousPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFamousPeople(searchQuery)
      .then(setFamousPeople)
      .finally(() => setLoading(false));
  }, [getFamousPeople, searchQuery]);

  const filteredPeople = useMemo(() => {
    if (!searchQuery) return famousPeople;
    const s = searchQuery.toLowerCase();
    return famousPeople.filter(
      (p) => p.firstName.toLowerCase().includes(s) || p.lastName.toLowerCase().includes(s),
    );
  }, [searchQuery, famousPeople]);

  const isValid = hasInvolvedPerson === "no" || (hasInvolvedPerson === "yes" && selectedPerson);

  const handleNext = async () => {
    if (!isValid) return;
    if (hasInvolvedPerson === "yes" && selectedPerson) {
      setReportPerson(selectedPerson);
      updateReport({ hasInvolvedPerson: true, involvedPerson: selectedPerson });
      router.push(routes.reportLocation);
      return;
    }
    if (hasInvolvedPerson === "no") {
      try {
        const { data: unknownPerson, error } = await api.people.unknown.get();
        if (error || !unknownPerson) throw new Error("Unknown person not found");
        setReportPerson(unknownPerson as Person);
        updateReport({ hasInvolvedPerson: false, involvedPerson: undefined });
        router.push(routes.reportLocation);
      } catch {
        console.error("Failed to get unknown person");
      }
    }
  };

  const handleAddNewPerson = async () => {
    if (!newPersonFirstName || !newPersonLastName) return;
    try {
      const { data, error } = await api.people.post({
        firstName: newPersonFirstName,
        lastName: newPersonLastName,
      });
      if (error) throw new Error(String(error));
      if (data) {
        const newPerson: Person = { ...data, isFamous: false };
        setSelectedPerson(newPerson);
        setShowAddNew(false);
      }
    } catch {
      console.error("Failed to create person");
    }
  };

  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
            <User className="text-primary h-8 w-8" />
          </div>
          <CardTitle className="text-2xl">شخص دخیل در پرونده</CardTitle>
          <CardDescription>آیا شخص خاصی در این پرونده دخیل است؟</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setHasInvolvedPerson("yes")}
              className={`relative flex flex-col items-center gap-3 rounded-xl border-2 p-4 transition-all duration-200 ${
                hasInvolvedPerson === "yes"
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border hover:border-primary/50 hover:bg-muted/50"
              }`}
            >
              {hasInvolvedPerson === "yes" && (
                <div className="bg-primary absolute top-2 left-2 flex h-5 w-5 items-center justify-center rounded-full">
                  <Check className="text-primary-foreground h-3 w-3" />
                </div>
              )}
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-full ${
                  hasInvolvedPerson === "yes" ? "bg-primary/20" : "bg-muted"
                }`}
              >
                <Check
                  className={`h-6 w-6 ${hasInvolvedPerson === "yes" ? "text-primary" : "text-muted-foreground"}`}
                />
              </div>
              <span
                className={`font-medium ${hasInvolvedPerson === "yes" ? "text-primary" : "text-foreground"}`}
              >
                بله، شخص دخیل است
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setHasInvolvedPerson("no");
                setSelectedPerson(null);
                setShowAddNew(false);
              }}
              className={`relative flex flex-col items-center gap-3 rounded-xl border-2 p-4 transition-all duration-200 ${
                hasInvolvedPerson === "no"
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border hover:border-primary/50 hover:bg-muted/50"
              }`}
            >
              {hasInvolvedPerson === "no" && (
                <div className="bg-primary absolute top-2 left-2 flex h-5 w-5 items-center justify-center rounded-full">
                  <Check className="text-primary-foreground h-3 w-3" />
                </div>
              )}
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-full ${
                  hasInvolvedPerson === "no" ? "bg-primary/20" : "bg-muted"
                }`}
              >
                <X
                  className={`h-6 w-6 ${hasInvolvedPerson === "no" ? "text-primary" : "text-muted-foreground"}`}
                />
              </div>
              <span
                className={`font-medium ${hasInvolvedPerson === "no" ? "text-primary" : "text-foreground"}`}
              >
                خیر، شخص خاصی نیست
              </span>
            </button>
          </div>

          {hasInvolvedPerson === "yes" && !showAddNew && (
            <>
              <Alert variant="default" className="border-amber-200 bg-amber-50">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  لطفاً از ذکر اطلاعات شخصی غیرضروری خودداری کنید.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="search">جستجو در افراد شناخته‌شده</Label>
                <div className="relative">
                  <Search className="text-muted-foreground absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2" />
                  <Input
                    id="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="نام شخص را جستجو کنید..."
                    className="pr-10"
                    dir="rtl"
                  />
                </div>
              </div>

              <div className="max-h-40 space-y-2 overflow-y-auto">
                {loading ? (
                  <p className="text-muted-foreground py-4 text-center">در حال بارگذاری...</p>
                ) : (
                  filteredPeople.map((person) => (
                    <button
                      key={person.id}
                      type="button"
                      onClick={() => setSelectedPerson(person)}
                      className={`w-full rounded-lg border p-3 text-right transition-colors ${
                        selectedPerson?.id === person.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted"
                      }`}
                    >
                      <span className="font-medium">
                        {person.firstName} {person.lastName}
                      </span>
                    </button>
                  ))
                )}
                {!loading && filteredPeople.length === 0 && searchQuery && (
                  <p className="text-muted-foreground py-4 text-center">شخصی با این نام یافت نشد</p>
                )}
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddNew(true)}
                className="w-full"
              >
                <UserPlus className="ml-2 h-4 w-4" />
                شخص مورد نظر در لیست نیست؟ افزودن شخص جدید
              </Button>

              {selectedPerson && (
                <div className="border-primary bg-primary/5 rounded-lg border p-3">
                  <p className="text-muted-foreground text-sm">شخص انتخاب شده:</p>
                  <p className="font-medium">
                    {selectedPerson.firstName} {selectedPerson.lastName}
                  </p>
                </div>
              )}
            </>
          )}

          {hasInvolvedPerson === "yes" && showAddNew && (
            <div className="bg-muted/30 space-y-4 rounded-xl border p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">افزودن شخص جدید</h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddNew(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2">
                <Label htmlFor="firstName">
                  نام <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="firstName"
                  value={newPersonFirstName}
                  onChange={(e) => setNewPersonFirstName(e.target.value)}
                  placeholder="نام شخص..."
                  dir="rtl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">
                  نام خانوادگی <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="lastName"
                  value={newPersonLastName}
                  onChange={(e) => setNewPersonLastName(e.target.value)}
                  placeholder="نام خانوادگی شخص..."
                  dir="rtl"
                />
              </div>
              <Button
                type="button"
                onClick={handleAddNewPerson}
                disabled={!newPersonFirstName || !newPersonLastName}
                className="w-full"
              >
                <UserPlus className="ml-2 h-4 w-4" />
                افزودن شخص
              </Button>
            </div>
          )}

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

          <ReportWizardProgress step={4} total={8} />
        </CardContent>
      </Card>
    </div>
  );
}
