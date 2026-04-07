"use client";

import { Fragment, useEffect, useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { api } from "@/lib/edyen";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, ArrowRight, ChevronRight, Check, X, Merge, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type PendingPerson = {
  id: string;
  firstName: string;
  lastName: string;
  fatherName?: string | null;
  nationalCode?: string | null;
  imageUrl?: string | null;
  title?: string | null;
  organization?: string | null;
  dateOfBirth?: string | null;
  address?: string | null;
  mobile?: string | null;
  phone?: string | null;
  status: string;
  createdAt: Date | string;
};

function formatDate(d: Date | string | null | undefined) {
  if (!d) return "—";
  const date = new Date(d);
  return date.toLocaleDateString("fa-IR");
}

export default function AdminPendingPeoplePage() {
  const { t } = useTranslation();

  const FIELD_LABELS: Record<string, string> = {
    firstName: t("adminPendingPeople.fieldLabels.firstName"),
    lastName: t("adminPendingPeople.fieldLabels.lastName"),
    fatherName: t("adminPendingPeople.fieldLabels.fatherName"),
    nationalCode: t("adminPendingPeople.fieldLabels.nationalCode"),
    title: t("adminPendingPeople.fieldLabels.title"),
    organization: t("adminPendingPeople.fieldLabels.organization"),
    dateOfBirth: t("adminPendingPeople.fieldLabels.dateOfBirth"),
    address: t("adminPendingPeople.fieldLabels.address"),
    mobile: t("adminPendingPeople.fieldLabels.mobile"),
    phone: t("adminPendingPeople.fieldLabels.phone"),
    imageUrl: t("adminPendingPeople.fieldLabels.imageUrl"),
  };

  const [pending, setPending] = useState<PendingPerson[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<PendingPerson | null>(null);
  const [mergeOpen, setMergeOpen] = useState(false);
  const [mergeSearch, setMergeSearch] = useState("");
  const [mergeResults, setMergeResults] = useState<PendingPerson[]>([]);
  const [mergeTarget, setMergeTarget] = useState<PendingPerson | null>(null);
  const [mergedFields, setMergedFields] = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState(false);

  const fetchPending = async () => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (search) params.search = search;
    const { data } = await api.admin.people.pending.get(params);
    setPending((data?.data as PendingPerson[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchPending();
  }, [search]);

  const openDetails = (p: PendingPerson) => {
    setSelectedPerson(p);
    setDetailsOpen(true);
  };

  const closeDetails = () => {
    setDetailsOpen(false);
    setSelectedPerson(null);
  };

  const handleApprove = async () => {
    if (!selectedPerson) return;
    setActionLoading(true);
    try {
      await api.admin.people({ id: selectedPerson.id }).approve.put();
      closeDetails();
      fetchPending();
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedPerson) return;
    if (!confirm(t("adminPendingPeople.rejectConfirm"))) return;
    setActionLoading(true);
    try {
      await api.admin.people({ id: selectedPerson.id }).reject.put();
      closeDetails();
      fetchPending();
    } finally {
      setActionLoading(false);
    }
  };

  const openMerge = () => {
    setMergeOpen(true);
    setMergeSearch("");
    setMergeResults([]);
    setMergeTarget(null);
    setMergedFields({});
  };

  const searchExistingPerson = async () => {
    if (!mergeSearch.trim()) return;
    const { data } = await api.admin.people.get({ query: { search: mergeSearch.trim() } });
    const list = (data?.data ?? []) as PendingPerson[];
    setMergeResults(list.filter((p) => p.id !== selectedPerson?.id));
  };

  const selectMergeTarget = (p: PendingPerson) => {
    setMergeTarget(p);
    const fields: Record<string, string> = {};
    const editable = [
      "firstName",
      "lastName",
      "fatherName",
      "nationalCode",
      "title",
      "organization",
      "dateOfBirth",
      "address",
      "mobile",
      "phone",
      "imageUrl",
    ];
    for (const key of editable) {
      const newVal = (selectedPerson as Record<string, unknown>)?.[key];
      const oldVal = (p as Record<string, unknown>)?.[key];
      fields[key] =
        (newVal != null && String(newVal).trim()
          ? String(newVal)
          : oldVal != null
            ? String(oldVal)
            : "") ?? "";
    }
    setMergedFields(fields);
  };

  const setMergedField = (key: string, value: string) => {
    setMergedFields((prev) => ({ ...prev, [key]: value }));
  };

  const handleMergeSave = async () => {
    if (!selectedPerson || !mergeTarget) return;
    setActionLoading(true);
    try {
      const body: {
        targetPersonId: string;
        firstName?: string;
        lastName?: string;
        fatherName?: string;
        nationalCode?: string;
        imageUrl?: string;
        title?: string;
        organization?: string;
        dateOfBirth?: string;
        address?: string;
        mobile?: string;
        phone?: string;
        [key: string]: string | undefined;
      } = {
        targetPersonId: mergeTarget.id,
      };
      for (const [k, v] of Object.entries(mergedFields)) {
        if (v?.trim()) body[k] = v.trim();
      }
      if (body.dateOfBirth) {
        const d = new Date(body.dateOfBirth);
        if (!isNaN(d.getTime())) body.dateOfBirth = d.toISOString();
      }
      await api.admin.people({ id: selectedPerson.id }).merge.post(body);
      setMergeOpen(false);
      closeDetails();
      fetchPending();
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/people">
              <ChevronRight className="ml-1 h-4 w-4" />
              {t("adminPendingPeople.back")}
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">{t("adminPendingPeople.title")}</h1>

            <div className="mb-4">
              <Input
                placeholder={t("adminPendingPeople.searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-lg"
              />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>{t("common.loading")}</p>
          ) : pending.length === 0 ? (
            <p className="text-muted-foreground">{t("adminPendingPeople.noPending")}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("adminPendingPeople.avatar")}</TableHead>
                  <TableHead>{t("adminPendingPeople.firstName")}</TableHead>
                  <TableHead>{t("adminPendingPeople.lastName")}</TableHead>
                  <TableHead>{t("adminPendingPeople.addedDate")}</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pending.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <Avatar>
                        <AvatarImage src={p.imageUrl ?? undefined} alt={p.firstName} />
                        <AvatarFallback>
                          {p.firstName[0]}
                          {p.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell>{p.firstName}</TableCell>
                    <TableCell>{p.lastName}</TableCell>
                    <TableCell>{formatDate(p.createdAt)}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => openDetails(p)}>
                        {t("common.details")}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Details Modal */}
      <Dialog open={detailsOpen} onOpenChange={(open) => !open && closeDetails()}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("adminPendingPeople.detailsTitle")}</DialogTitle>
          </DialogHeader>
          {selectedPerson && (
            <div className="space-y-2 py-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">
                    {t("adminPendingPeople.labelFirstName")}
                  </span>{" "}
                  {selectedPerson.firstName}
                </div>
                <div>
                  <span className="text-muted-foreground">
                    {t("adminPendingPeople.labelLastName")}
                  </span>{" "}
                  {selectedPerson.lastName}
                </div>
                <div>
                  <span className="text-muted-foreground">
                    {t("adminPendingPeople.labelFatherName")}
                  </span>{" "}
                  {selectedPerson.fatherName ?? "—"}
                </div>
                <div>
                  <span className="text-muted-foreground">
                    {t("adminPendingPeople.labelNationalCode")}
                  </span>{" "}
                  {selectedPerson.nationalCode ?? "—"}
                </div>
                <div>
                  <span className="text-muted-foreground">
                    {t("adminPendingPeople.labelTitle")}
                  </span>{" "}
                  {selectedPerson.title ?? "—"}
                </div>
                <div>
                  <span className="text-muted-foreground">
                    {t("adminPendingPeople.labelOrganization")}
                  </span>{" "}
                  {selectedPerson.organization ?? "—"}
                </div>
                <div>
                  <span className="text-muted-foreground">
                    {t("adminPendingPeople.labelDateOfBirth")}
                  </span>{" "}
                  {formatDate(selectedPerson.dateOfBirth)}
                </div>
                <div>
                  <span className="text-muted-foreground">
                    {t("adminPendingPeople.labelAddress")}
                  </span>{" "}
                  {selectedPerson.address ?? "—"}
                </div>
                <div>
                  <span className="text-muted-foreground">
                    {t("adminPendingPeople.labelMobile")}
                  </span>{" "}
                  {selectedPerson.mobile ?? "—"}
                </div>
                <div>
                  <span className="text-muted-foreground">
                    {t("adminPendingPeople.labelPhone")}
                  </span>{" "}
                  {selectedPerson.phone ?? "—"}
                </div>
              </div>
              <DialogFooter className="gap-2 pt-8">
                <Button
                  onClick={handleApprove}
                  disabled={actionLoading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Check className="ml-0.5 h-4 w-4" />
                  {t("adminPendingPeople.approveAsNew")}
                </Button>
                <Button variant="outline" onClick={openMerge} disabled={actionLoading}>
                  <Merge className="ml-0.5 h-4 w-4" />
                  {t("adminPendingPeople.mergeWithExisting")}
                </Button>
                <Button variant="destructive" onClick={handleReject} disabled={actionLoading}>
                  <X className="ml-0.5 h-4 w-4" />
                  {t("adminPendingPeople.reject")}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Merge Modal */}
      <Dialog open={mergeOpen} onOpenChange={setMergeOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("adminPendingPeople.mergeTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex gap-2">
              <Input
                placeholder={t("adminPendingPeople.mergeSearchPlaceholder")}
                value={mergeSearch}
                onChange={(e) => setMergeSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchExistingPerson()}
              />
              <Button onClick={searchExistingPerson}>
                <Search className="ml-2 h-4 w-4" />
                {t("adminPendingPeople.mergeSearch")}
              </Button>
            </div>

            {mergeResults.length > 0 && !mergeTarget && (
              <div className="space-y-2">
                <p className="text-sm font-medium">{t("adminPendingPeople.selectPerson")}</p>
                <div className="max-h-40 space-y-1 overflow-y-auto rounded border p-2">
                  {mergeResults.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => selectMergeTarget(p)}
                      className="bg-muted/50 hover:bg-muted flex w-full items-center justify-between rounded p-2 text-start"
                    >
                      <span className="text-xs">
                        {p.firstName} {p.lastName}
                        {p.title ? ` (${p.title})` : ""}
                        {p.fatherName && ` - ${p.fatherName}`}
                        {p.nationalCode && ` - ${p.nationalCode}`}
                      </span>
                      <ArrowLeft className="h-3 w-3" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {mergeTarget && selectedPerson && (
              <div className="space-y-4">
                <p className="text-sm font-medium">{t("adminPendingPeople.mergeFieldsHint")}</p>
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-sm">
                  <div className="text-muted-foreground font-medium">
                    {t("adminPendingPeople.newUser")}
                  </div>
                  <div />
                  <div className="text-muted-foreground font-medium">
                    {t("adminPendingPeople.existingUser")}
                  </div>
                  {Object.entries(FIELD_LABELS).map(([key, label]) => {
                    const newVal = (selectedPerson as Record<string, unknown>)?.[key];
                    const oldVal = (mergeTarget as Record<string, unknown>)?.[key];
                    const newStr = newVal != null ? String(newVal) : "";
                    const oldStr = oldVal != null ? String(oldVal) : "";
                    const current = mergedFields[key] ?? "";
                    return (
                      <Fragment key={key}>
                        <div className="bg-muted/30 rounded border p-2 text-xs">
                          {newStr || "—"}
                        </div>
                        <div className="flex flex-col items-center">
                          <ArrowRight className="text-primary h-4 w-4" />
                        </div>
                        <div className="rounded border p-2">
                          <Input
                            value={current}
                            onChange={(e) => setMergedField(key, e.target.value)}
                            placeholder={oldStr || t("adminPendingPeople.emptyPlaceholder")}
                            className="h-8 text-sm"
                          />
                        </div>
                      </Fragment>
                    );
                  })}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setMergeTarget(null)}>
                    {t("adminPendingPeople.backToSelection")}
                  </Button>
                  <Button onClick={handleMergeSave} disabled={actionLoading}>
                    {t("adminPendingPeople.saveMerge")}
                  </Button>
                </DialogFooter>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
