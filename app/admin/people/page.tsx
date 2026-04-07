"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { api } from "@/lib/edyen";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Plus, Pencil, Eye, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function detailValue(value?: string | null): string {
  return value != null && value !== "" ? value : "-";
}

type Person = {
  id: string;
  firstName: string;
  lastName: string;
  fatherName?: string | null;
  nationalCode?: string | null;
  imageUrl?: string | null;
  title?: string | null;
  organization?: string | null;
  dateOfBirth?: Date | string | null;
  address?: string | null;
  mobile?: string | null;
  phone?: string | null;
  isFamous: boolean;
  status?: string | null;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
};

export default function AdminPeoplePage() {
  const { t } = useTranslation();
  const [people, setPeople] = useState<Person[]>([]);
  const [search, setSearch] = useState("");
  const [famousOnly, setFamousOnly] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsPerson, setDetailsPerson] = useState<Person | null>(null);
  const [editing, setEditing] = useState<Person | null>(null);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    fatherName: "",
    nationalCode: "",
    imageUrl: "",
    title: "",
    organization: "",
    dateOfBirth: "",
    address: "",
    mobile: "",
    phone: "",
    isFamous: false,
  });

  const fetchPeople = async () => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (famousOnly !== null) params.famous = String(famousOnly);
    const { data } = await api.admin.people.get(params);
    setPeople(data?.data ?? []);
    setLoading(false);
  };

  const fetchPendingCount = async () => {
    const { data } = await api.admin.people.pending.get({});
    const list = (data?.data ?? []) as unknown[];
    setPendingCount(list.length);
  };

  useEffect(() => {
    fetchPeople();
  }, [search, famousOnly]);

  useEffect(() => {
    fetchPendingCount();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({
      firstName: "",
      lastName: "",
      fatherName: "",
      nationalCode: "",
      imageUrl: "",
      title: "",
      organization: "",
      dateOfBirth: "",
      address: "",
      mobile: "",
      phone: "",
      isFamous: false,
    });
    setDialogOpen(true);
  };

  const openEdit = (p: Person) => {
    setEditing(p);
    setForm({
      firstName: p.firstName,
      lastName: p.lastName,
      fatherName: p.fatherName ?? "",
      nationalCode: p.nationalCode ?? "",
      imageUrl: p.imageUrl ?? "",
      title: p.title ?? "",
      organization: p.organization ?? "",
      dateOfBirth: p.dateOfBirth ? new Date(p.dateOfBirth).toISOString().slice(0, 10) : "",
      address: p.address ?? "",
      mobile: p.mobile ?? "",
      phone: p.phone ?? "",
      isFamous: p.isFamous,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      firstName: form.firstName,
      lastName: form.lastName,
      fatherName: form.fatherName || undefined,
      nationalCode: form.nationalCode || undefined,
      imageUrl: form.imageUrl || undefined,
      title: form.title || undefined,
      organization: form.organization || undefined,
      dateOfBirth: form.dateOfBirth ? form.dateOfBirth : undefined,
      address: form.address || undefined,
      mobile: form.mobile || undefined,
      phone: form.phone || undefined,
      isFamous: form.isFamous,
    };
    if (editing) {
      await api.admin.people({ id: editing.id }).put(payload);
    } else {
      await api.admin.people.post(payload);
    }
    setDialogOpen(false);
    fetchPeople();
  };

  const toggleFamous = async (p: Person) => {
    await api.admin.people({ id: p.id }).put({ isFamous: !p.isFamous });
    fetchPeople();
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("adminPeople.title")}</h1>
        <div className="flex gap-1">
          {pendingCount > 0 && (
            <Button variant="outline" asChild className="relative">
              <Link href="/admin/people/pending" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {t("adminPeople.pendingApproval")}
                <Badge variant="destructive" className="mr-1 min-w-5 px-1.5 py-0 text-[10px]">
                  {pendingCount}
                </Badge>
              </Link>
            </Button>
          )}
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            {t("common.add")}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <h3 className="text-lg font-bold">{t("adminPeople.listTitle")}</h3>
            <div className="flex gap-4">
              <Input
                placeholder={t("adminPeople.searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-xs"
              />
              <label className="flex items-center gap-2 text-sm">
                <Switch
                  checked={famousOnly === true}
                  onCheckedChange={(c) => setFamousOnly(c ? true : null)}
                />
                {t("adminPeople.famous")}
              </label>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent dir="rtl">
          {loading ? (
            <p>{t("common.loading")}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("adminPeople.avatar")}</TableHead>
                  <TableHead>{t("adminPeople.name")}</TableHead>
                  <TableHead>{t("adminPeople.title")}</TableHead>
                  <TableHead>{t("adminPeople.famous")}</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {people.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <Avatar>
                        <AvatarImage
                          src={p.imageUrl ?? undefined}
                          alt={`${p.firstName} ${p.lastName}`}
                        />
                        <AvatarFallback>
                          {p.firstName[0]}
                          {p.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell>
                      {p.firstName} {p.lastName}
                    </TableCell>
                    <TableCell>{p.title ?? "—"}</TableCell>
                    <TableCell>
                      <ToggleGroup
                        type="single"
                        value={p.isFamous ? "famous" : "regular"}
                        onValueChange={(v) => {
                          if (v === "famous" && !p.isFamous) toggleFamous(p);
                          if (v === "regular" && p.isFamous) toggleFamous(p);
                        }}
                        variant="outline"
                        size="sm"
                        className="w-fit"
                      >
                        <ToggleGroupItem
                          className="px-3 text-xs"
                          value="regular"
                          aria-label={t("adminPeople.regular")}
                        >
                          {t("adminPeople.regular")}
                        </ToggleGroupItem>
                        <ToggleGroupItem
                          className="px-3 text-xs"
                          value="famous"
                          aria-label={t("adminPeople.famous")}
                        >
                          {t("adminPeople.famous")}
                        </ToggleGroupItem>
                      </ToggleGroup>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => {
                            setDetailsPerson(p);
                            setDetailsOpen(true);
                          }}
                          title={t("adminPeople.viewDetailsTitle")}
                        >
                          <Eye className="h-3 w-3" />
                          {t("adminPeople.viewDetails")}
                        </Button>
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => openEdit(p)}
                          title={t("adminPeople.edit")}
                        >
                          <Pencil className="h-3 w-3" />
                          {t("adminPeople.edit")}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("adminPeople.personDetails")}</DialogTitle>
          </DialogHeader>
          {detailsPerson && (
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={detailsPerson.imageUrl ?? undefined} alt="" />
                  <AvatarFallback className="text-lg">
                    {detailsPerson.firstName[0]}
                    {detailsPerson.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <p className="text-lg font-semibold">
                    {detailsPerson.firstName} {detailsPerson.lastName}
                  </p>
                  <Badge variant={detailsPerson.isFamous ? "default" : "secondary"}>
                    {detailsPerson.isFamous ? t("adminPeople.famous") : t("adminPeople.regular")}
                  </Badge>
                  <Badge variant="outline" className="mr-2">
                    {detailsPerson.status === "approved"
                      ? t("adminPeople.statusApproved")
                      : detailsPerson.status === "pending"
                        ? t("adminPeople.statusPending")
                        : (detailsPerson.status ?? t("adminPeople.statusUnknown"))}
                  </Badge>
                </div>
              </div>
              <Table className="[&_td]:border-border w-full border-collapse overflow-hidden rounded-lg font-sans text-sm [&_td]:border [&_td]:px-4 [&_td]:py-2">
                <TableBody>
                  {[
                    [t("adminPeople.fieldId"), detailValue(detailsPerson.id)],
                    [t("adminPeople.fieldFatherName"), detailValue(detailsPerson.fatherName)],
                    [t("adminPeople.fieldTitle"), detailValue(detailsPerson.title)],
                    [t("adminPeople.fieldNationalCode"), detailValue(detailsPerson.nationalCode)],
                    [t("adminPeople.fieldOrganization"), detailValue(detailsPerson.organization)],
                    [
                      t("adminPeople.fieldDateOfBirth"),
                      detailValue(
                        detailsPerson.dateOfBirth
                          ? new Date(detailsPerson.dateOfBirth).toLocaleDateString("fa-IR")
                          : undefined,
                      ),
                    ],
                    [t("adminPeople.fieldMobile"), detailValue(detailsPerson.mobile)],
                    [t("adminPeople.fieldPhone"), detailValue(detailsPerson.phone)],
                    [t("adminPeople.fieldAddress"), detailValue(detailsPerson.address)],
                    [t("adminPeople.fieldImageUrl"), detailValue(detailsPerson.imageUrl)],
                    [
                      t("adminPeople.fieldCreatedAt"),
                      detailValue(
                        detailsPerson.createdAt
                          ? new Date(detailsPerson.createdAt).toLocaleDateString("fa-IR")
                          : undefined,
                      ),
                    ],
                    [
                      t("adminPeople.fieldUpdatedAt"),
                      detailValue(
                        detailsPerson.updatedAt
                          ? new Date(detailsPerson.updatedAt).toLocaleDateString("fa-IR")
                          : undefined,
                      ),
                    ],
                  ].map(([label, value]) => (
                    <TableRow key={label}>
                      <TableCell className="text-muted-foreground bg-muted/50 border-border w-48 min-w-36 border-r font-medium">
                        {label}
                      </TableCell>
                      <TableCell className="text-foreground wrap-break-word">{value}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDetailsOpen(false)}>
                  {t("common.close")}
                </Button>
                <Button
                  onClick={() => {
                    setDetailsOpen(false);
                    openEdit(detailsPerson);
                  }}
                >
                  <Pencil className="ml-2 h-4 w-4" />
                  {t("adminPeople.edit")}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? t("adminPeople.editPerson") : t("adminPeople.addPerson")}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t("adminPeople.firstName")}</Label>
                <Input
                  value={form.firstName}
                  onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label>{t("adminPeople.lastName")}</Label>
                <Input
                  value={form.lastName}
                  onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label>{t("adminPeople.fatherName")}</Label>
                <Input
                  value={form.fatherName}
                  onChange={(e) => setForm((f) => ({ ...f, fatherName: e.target.value }))}
                />
              </div>
              <div>
                <Label>{t("adminPeople.titlePosition")}</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t("adminPeople.nationalCode")}</Label>
                <Input
                  value={form.nationalCode}
                  onChange={(e) => setForm((f) => ({ ...f, nationalCode: e.target.value }))}
                />
              </div>
              <div>
                <Label>{t("adminPeople.organization")}</Label>
                <Input
                  value={form.organization}
                  onChange={(e) => setForm((f) => ({ ...f, organization: e.target.value }))}
                />
              </div>
              <div>
                <Label>{t("adminPeople.dateOfBirth")}</Label>
                <Input
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(e) => setForm((f) => ({ ...f, dateOfBirth: e.target.value }))}
                />
              </div>
              <div>
                <Label>{t("adminPeople.mobile")}</Label>
                <Input
                  value={form.mobile}
                  onChange={(e) => setForm((f) => ({ ...f, mobile: e.target.value }))}
                />
              </div>
              <div>
                <Label>{t("adminPeople.phone")}</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label>{t("adminPeople.address")}</Label>
              <Input
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              />
            </div>
            <div>
              <Label>{t("adminPeople.avatarUrl")}</Label>
              <Input
                value={form.imageUrl}
                onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                placeholder="https://..."
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.isFamous}
                onCheckedChange={(c) => setForm((f) => ({ ...f, isFamous: c }))}
              />
              <Label>{t("adminPeople.famousPerson")}</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button type="submit">{editing ? t("common.save") : t("common.add")}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
