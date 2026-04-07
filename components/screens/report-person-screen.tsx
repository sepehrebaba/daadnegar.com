"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useReport } from "@/context/report-context";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Person } from "@/types";
import { useTranslation } from "react-i18next";

export function ReportPersonScreen() {
  const router = useRouter();
  const { updateReport, currentReport, setReportPerson } = useReport();
  const { t } = useTranslation();
  const [hasInvolvedPerson, setHasInvolvedPerson] = useState<"yes" | "no" | "">(
    currentReport?.hasInvolvedPerson === true
      ? "yes"
      : currentReport?.hasInvolvedPerson === false
        ? "no"
        : "",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(
    currentReport?.involvedPerson || currentReport?.person || null,
  );
  const [showAddNew, setShowAddNew] = useState(false);
  const [showSimilarWarning, setShowSimilarWarning] = useState(false);
  const [_pendingAdd, setPendingAdd] = useState(false);
  const [newPersonFirstName, setNewPersonFirstName] = useState("");
  const [newPersonLastName, setNewPersonLastName] = useState("");
  const [newPersonFatherName, setNewPersonFatherName] = useState("");
  const [newPersonOrganization, setNewPersonOrganization] = useState("");
  const [newPersonTitle, setNewPersonTitle] = useState("");
  const [newPersonDateOfBirth, setNewPersonDateOfBirth] = useState("");
  const [newPersonNationalCode, setNewPersonNationalCode] = useState("");
  const [newPersonAddress, setNewPersonAddress] = useState("");
  const [newPersonMobile, setNewPersonMobile] = useState("");
  const [newPersonPhone, setNewPersonPhone] = useState("");
  const [famousPeople, setFamousPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.people.famous
      .get({ query: { search: searchQuery || undefined } })
      .then(({ data, error }) => {
        if (!error && data) setFamousPeople(data as Person[]);
      })
      .finally(() => setLoading(false));
  }, [searchQuery]);

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

  const resetNewPersonForm = () => {
    setNewPersonFirstName("");
    setNewPersonLastName("");
    setNewPersonFatherName("");
    setNewPersonOrganization("");
    setNewPersonTitle("");
    setNewPersonDateOfBirth("");
    setNewPersonNationalCode("");
    setNewPersonAddress("");
    setNewPersonMobile("");
    setNewPersonPhone("");
  };

  const performAddPerson = async () => {
    if (!newPersonFirstName || !newPersonLastName) return;
    try {
      const { data, error } = await api.people.post({
        firstName: newPersonFirstName.trim(),
        lastName: newPersonLastName.trim(),
        fatherName: newPersonFatherName.trim() || undefined,
        organization: newPersonOrganization.trim() || undefined,
        title: newPersonTitle.trim() || undefined,
        dateOfBirth: newPersonDateOfBirth || undefined,
        nationalCode: newPersonNationalCode.trim() || undefined,
        address: newPersonAddress.trim() || undefined,
        mobile: newPersonMobile.trim() || undefined,
        phone: newPersonPhone.trim() || undefined,
      });
      if (error) throw new Error(String(error));
      if (data) {
        const newPerson: Person = {
          id: data.id,
          firstName: data.firstName,
          lastName: data.lastName,
          nationalCode: data.nationalCode ?? undefined,
          imageUrl: data.imageUrl ?? undefined,
          isFamous: false,
        };
        setSelectedPerson(newPerson);
        setShowAddNew(false);
        setShowSimilarWarning(false);
        setPendingAdd(false);
      }
    } catch {
      console.error("Failed to create person");
    }
  };

  const handleAddNewPerson = async () => {
    if (!newPersonFirstName || !newPersonLastName) return;
    const firstName = newPersonFirstName.trim();
    const lastName = newPersonLastName.trim();
    const { data: similarData } = await api.people.famous.get({ query: { search: firstName } });
    const similar = (similarData as Person[]) ?? [];
    const hasSimilar = similar.some(
      (p) =>
        p.firstName.trim().toLowerCase() === firstName.toLowerCase() &&
        p.lastName.trim().toLowerCase() === lastName.toLowerCase(),
    );
    if (hasSimilar) {
      setPendingAdd(true);
      setShowSimilarWarning(true);
    } else {
      await performAddPerson();
    }
  };

  const handleConfirmAddDespiteSimilar = async () => {
    setShowSimilarWarning(false);
    await performAddPerson();
    setPendingAdd(false);
  };

  return (
    <div className="bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
            <User className="text-primary h-8 w-8" />
          </div>
          <CardTitle className="text-2xl">{t("report.person.title")}</CardTitle>
          <CardDescription>{t("report.person.description")}</CardDescription>
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
                {t("report.person.hasPersonYes")}
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
                {t("report.person.hasPersonNo")}
              </span>
            </button>
          </div>

          {hasInvolvedPerson === "yes" && !showAddNew && (
            <>
              <Label className="mb-2" htmlFor="search">
                {t("report.person.searchPeople")}
              </Label>
              <div className="bg-muted-foreground/2 rounded-lg border p-3">
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="text-muted-foreground absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2" />
                    <Input
                      id="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t("report.person.searchPlaceholder")}
                      className="pr-10"
                    />
                  </div>

                  <div className="max-h-40 space-y-2 overflow-y-auto">
                    {loading ? (
                      <p className="text-muted-foreground py-4 text-center">
                        {t("common.loading")}
                      </p>
                    ) : (
                      filteredPeople.map((person) => (
                        <button
                          key={person.id}
                          type="button"
                          onClick={() => setSelectedPerson(person)}
                          className={`bg-card flex w-full items-center gap-3 rounded-lg border p-2 text-start text-sm transition-colors ${
                            selectedPerson?.id === person.id
                              ? "border-primary bg-primary/5"
                              : "border-border hover:bg-muted"
                          }`}
                        >
                          <Avatar className="size-8 shrink-0">
                            {person.imageUrl ? (
                              <AvatarImage src={person.imageUrl} alt={person.firstName} />
                            ) : null}
                            <AvatarFallback className="text-xs font-medium">
                              {person.firstName?.[0] ?? ""} {person.lastName?.[0] ?? ""}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">
                            {person.firstName} {person.lastName}
                          </span>
                        </button>
                      ))
                    )}
                    {!loading && filteredPeople.length === 0 && searchQuery && (
                      <p className="text-muted-foreground py-4 text-center">
                        {t("report.person.notFoundInSearch")}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddNew(true)}
                className="w-full"
              >
                <UserPlus className="ml-2 h-4 w-4" />
                {t("report.person.addNotInList")}
              </Button>

              {selectedPerson && (
                <div className="border-primary bg-primary/5 rounded-lg border p-3">
                  <p className="text-muted-foreground text-sm">
                    {t("report.person.selectedPerson")}
                  </p>
                  <p className="font-medium">
                    {selectedPerson.firstName} {selectedPerson.lastName}
                  </p>
                </div>
              )}
            </>
          )}

          <Dialog
            open={showAddNew}
            onOpenChange={(open) => {
              setShowAddNew(open);
              if (!open) resetNewPersonForm();
            }}
          >
            <DialogContent scrollable>
              <DialogHeader className="shrink-0">
                <DialogTitle>{t("report.person.addNewTitle")}</DialogTitle>
              </DialogHeader>
              <div className="min-h-0 flex-1 overflow-y-auto">
                <Alert
                  size="sm"
                  variant="default"
                  className="mb-1 border-amber-200 bg-amber-50 dark:border-yellow-400"
                >
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-600" />
                  <AlertDescription className="text-amber-800">
                    {t("report.person.newPersonWarning")}
                  </AlertDescription>
                </Alert>
                <Alert
                  size="sm"
                  variant="default"
                  className="border-amber-200 bg-amber-50 dark:border-yellow-400"
                >
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-600" />
                  <AlertDescription className="text-amber-800">
                    {t("report.person.newPersonCheckWarning")}
                  </AlertDescription>
                </Alert>

                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="modal-firstName">
                      {t("report.person.firstName")} <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="modal-firstName"
                      value={newPersonFirstName}
                      onChange={(e) => setNewPersonFirstName(e.target.value)}
                      placeholder={t("report.person.firstNamePlaceholder")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="modal-lastName">
                      {t("report.person.lastName")} <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="modal-lastName"
                      value={newPersonLastName}
                      onChange={(e) => setNewPersonLastName(e.target.value)}
                      placeholder={t("report.person.lastNamePlaceholder")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="modal-fatherName">{t("report.person.fatherName")}</Label>
                    <Input
                      id="modal-fatherName"
                      value={newPersonFatherName}
                      onChange={(e) => setNewPersonFatherName(e.target.value)}
                      placeholder={t("report.person.fatherNamePlaceholder")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="modal-organization">{t("report.person.organization")}</Label>
                    <Input
                      id="modal-organization"
                      value={newPersonOrganization}
                      onChange={(e) => setNewPersonOrganization(e.target.value)}
                      placeholder={t("report.person.organizationPlaceholder")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="modal-title">{t("report.person.personTitle")}</Label>
                    <Input
                      id="modal-title"
                      value={newPersonTitle}
                      onChange={(e) => setNewPersonTitle(e.target.value)}
                      placeholder={t("report.person.personTitlePlaceholder")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="modal-dateOfBirth">{t("report.person.dateOfBirth")}</Label>
                    <Input
                      id="modal-dateOfBirth"
                      type="date"
                      value={newPersonDateOfBirth}
                      onChange={(e) => setNewPersonDateOfBirth(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="modal-nationalCode">{t("report.person.nationalCode")}</Label>
                    <Input
                      id="modal-nationalCode"
                      value={newPersonNationalCode}
                      onChange={(e) => setNewPersonNationalCode(e.target.value)}
                      placeholder={t("report.person.nationalCodePlaceholder")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="modal-address">{t("report.person.address")}</Label>
                    <Input
                      id="modal-address"
                      value={newPersonAddress}
                      onChange={(e) => setNewPersonAddress(e.target.value)}
                      placeholder={t("report.person.addressPlaceholder")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="modal-mobile">{t("report.person.mobile")}</Label>
                    <Input
                      id="modal-mobile"
                      value={newPersonMobile}
                      onChange={(e) => setNewPersonMobile(e.target.value)}
                      placeholder={t("report.person.mobilePlaceholder")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="modal-phone">{t("report.person.phone")}</Label>
                    <Input
                      id="modal-phone"
                      value={newPersonPhone}
                      onChange={(e) => setNewPersonPhone(e.target.value)}
                      placeholder={t("report.person.phonePlaceholder")}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter className="shrink-0">
                <Button type="button" variant="outline" onClick={() => setShowAddNew(false)}>
                  {t("common.cancel")}
                </Button>
                <Button
                  type="button"
                  onClick={handleAddNewPerson}
                  disabled={!newPersonFirstName || !newPersonLastName}
                >
                  <UserPlus className="ml-2 h-4 w-4" />
                  {t("report.person.addPersonSubmit")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <AlertDialog open={showSimilarWarning} onOpenChange={setShowSimilarWarning}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("report.person.similarExists")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t("report.person.similarExistsDescription")}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel
                  onClick={() => {
                    setPendingAdd(false);
                  }}
                >
                  {t("common.cancel")}
                </AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirmAddDespiteSimilar}>
                  {t("report.person.addAnyway")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

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

          <ReportWizardProgress step={4} total={8} />
        </CardContent>
      </Card>
    </div>
  );
}
