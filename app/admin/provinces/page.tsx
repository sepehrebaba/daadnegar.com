"use client";

import React, { useEffect, useState } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Pencil, Trash2, ChevronLeft, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type Province = { id: string; name: string; sortOrder: number; cities: City[] };
type City = {
  id: string;
  name: string;
  provinceId: string;
  sortOrder: number;
};

export default function AdminProvincesPage() {
  const { t } = useTranslation();
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [cityDialogOpen, setCityDialogOpen] = useState(false);
  const [editingProvince, setEditingProvince] = useState<Province | null>(null);
  const [editingCity, setEditingCity] = useState<City | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [provinceForm, setProvinceForm] = useState({ name: "", sortOrder: 0 });
  const [cityForm, setCityForm] = useState({
    name: "",
    provinceId: "",
    sortOrder: 0,
  });

  const load = async () => {
    const { data: res, error } = await api.admin.provinces.get();
    if (error) return;
    setProvinces(res?.data ?? []);
  };

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const openCreateProvince = () => {
    setEditingProvince(null);
    setProvinceForm({ name: "", sortOrder: provinces.length });
    setDialogOpen(true);
  };

  const openEditProvince = (p: Province) => {
    setEditingProvince(p);
    setProvinceForm({ name: p.name, sortOrder: p.sortOrder });
    setDialogOpen(true);
  };

  const openCreateCity = (provinceId: string) => {
    const p = provinces.find((x) => x.id === provinceId);
    setEditingCity(null);
    setCityForm({
      name: "",
      provinceId: provinceId,
      sortOrder: p ? p.cities.length : 0,
    });
    setCityDialogOpen(true);
  };

  const openEditCity = (c: City) => {
    setEditingCity(c);
    setCityForm({
      name: c.name,
      provinceId: c.provinceId,
      sortOrder: c.sortOrder,
    });
    setCityDialogOpen(true);
  };

  const handleProvinceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProvince) {
      const { error } = await api.admin.provinces({ id: editingProvince.id }).put({
        name: provinceForm.name,
        sortOrder: provinceForm.sortOrder,
      });
      if (!error) {
        setDialogOpen(false);
        load();
      }
    } else {
      const { error } = await api.admin.provinces.post({
        name: provinceForm.name,
        sortOrder: provinceForm.sortOrder,
      });
      if (!error) {
        setDialogOpen(false);
        load();
      }
    }
  };

  const handleCitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cityForm.provinceId) return;
    if (editingCity) {
      const { error } = await api.admin.cities({ id: editingCity.id }).put({
        name: cityForm.name,
        provinceId: cityForm.provinceId,
        sortOrder: cityForm.sortOrder,
      });
      if (!error) {
        setCityDialogOpen(false);
        load();
      }
    } else {
      const { error } = await api.admin.cities.post({
        name: cityForm.name,
        provinceId: cityForm.provinceId,
        sortOrder: cityForm.sortOrder,
      });
      if (!error) {
        setCityDialogOpen(false);
        load();
      }
    }
  };

  const handleDeleteProvince = async (id: string) => {
    if (!confirm(t("adminProvinces.deleteProvinceConfirm"))) return;
    const { error } = await api.admin.provinces({ id }).delete();
    if (!error) load();
  };

  const handleDeleteCity = async (id: string) => {
    if (!confirm(t("adminProvinces.deleteCityConfirm"))) return;
    const { error } = await api.admin.cities({ id }).delete();
    if (!error) load();
  };

  const toggleExpand = (id: string) => {
    setExpanded((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const renderRow = (p: Province) => {
    const hasChildren = p.cities.length > 0;
    const isExpanded = expanded.has(p.id);
    const nameCell = (
      <TableCell className="w-full">
        <div
          role={hasChildren ? "button" : undefined}
          tabIndex={hasChildren ? 0 : undefined}
          className={`flex min-w-0 items-center gap-1 ${hasChildren ? "w-full cursor-pointer rounded select-none" : ""}`}
          onClick={hasChildren ? () => toggleExpand(p.id) : undefined}
          onKeyDown={
            hasChildren
              ? (e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggleExpand(p.id);
                  }
                }
              : undefined
          }
          aria-label={
            hasChildren
              ? isExpanded
                ? t("adminProvinces.collapse")
                : t("adminProvinces.expand")
              : undefined
          }
        >
          {hasChildren ? (
            <span className="shrink-0">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </span>
          ) : (
            <span className="w-5 shrink-0" />
          )}
          <span className="min-w-0 truncate font-medium">{p.name}</span>
        </div>
      </TableCell>
    );
    return (
      <React.Fragment key={p.id}>
        <TableRow className={cn("w-full", hasChildren ? "bg-muted/70" : "bg-muted/30")}>
          {nameCell}
          <TableCell>{t("adminProvinces.province")}</TableCell>
          <TableCell dir="ltr">{p.sortOrder}</TableCell>
          <TableCell>
            <div className="flex justify-start gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  openCreateCity(p.id);
                }}
                title={t("adminProvinces.addCity")}
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => openEditProvince(p)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleDeleteProvince(p.id)}>
                <Trash2 className="text-destructive h-4 w-4" />
              </Button>
            </div>
          </TableCell>
        </TableRow>
        {hasChildren &&
          isExpanded &&
          p.cities.map((c) => (
            <TableRow key={c.id}>
              <TableCell>
                <div className="flex min-w-0 items-center gap-1" style={{ paddingInlineStart: 24 }}>
                  <span className="w-5 shrink-0" />
                  <span className="min-w-0 truncate">{c.name}</span>
                </div>
              </TableCell>
              <TableCell>{t("adminProvinces.city")}</TableCell>
              <TableCell dir="ltr">{c.sortOrder}</TableCell>
              <TableCell>
                <div className="flex justify-start gap-2">
                  <Button variant="ghost" size="sm" onClick={() => openEditCity(c)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteCity(c.id)}>
                    <Trash2 className="text-destructive h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
      </React.Fragment>
    );
  };

  if (loading)
    return (
      <div className="p-6" dir="rtl">
        {t("common.loading")}
      </div>
    );

  return (
    <div dir="rtl" className="text-start">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{t("adminProvinces.title")}</h1>
        <Button onClick={openCreateProvince}>
          <Plus className="me-2 h-4 w-4" />
          {t("adminProvinces.addProvince")}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("adminProvinces.listTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table className="w-full min-w-full table-fixed" dir="rtl">
            <colgroup>
              <col style={{ width: "50%" }} />
              <col style={{ width: "15%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "25%" }} />
            </colgroup>
            <TableHeader>
              <TableRow>
                <TableHead>{t("adminProvinces.name")}</TableHead>
                <TableHead>{t("adminProvinces.type")}</TableHead>
                <TableHead>{t("adminProvinces.order")}</TableHead>
                <TableHead className="w-32">{t("adminProvinces.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>{provinces.map((p) => renderRow(p))}</TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent dir="rtl" className="text-start">
          <DialogHeader>
            <DialogTitle>
              {editingProvince ? t("adminProvinces.editProvince") : t("adminProvinces.addProvince")}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleProvinceSubmit} className="space-y-4">
            <div>
              <Label>{t("adminProvinces.name")}</Label>
              <Input
                value={provinceForm.name}
                onChange={(e) => setProvinceForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label>{t("adminProvinces.order")}</Label>
              <Input
                type="number"
                value={provinceForm.sortOrder}
                onChange={(e) =>
                  setProvinceForm((f) => ({
                    ...f,
                    sortOrder: Number(e.target.value),
                  }))
                }
                dir="ltr"
                className="text-left"
              />
            </div>
            <DialogFooter className="gap-2">
              <Button type="submit">
                {editingProvince ? t("common.save") : t("adminProvinces.addProvince")}
              </Button>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                {t("common.cancel")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={cityDialogOpen} onOpenChange={setCityDialogOpen}>
        <DialogContent dir="rtl" className="text-start">
          <DialogHeader>
            <DialogTitle>
              {editingCity ? t("adminProvinces.editCity") : t("adminProvinces.addCity")}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCitySubmit} className="space-y-4">
            <div>
              <Label>{t("adminProvinces.cityName")}</Label>
              <Input
                value={cityForm.name}
                onChange={(e) => setCityForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label>{t("adminProvinces.province")}</Label>
              <select
                value={cityForm.provinceId}
                onChange={(e) => setCityForm((f) => ({ ...f, provinceId: e.target.value }))}
                className="border-input h-9 w-full rounded-md border px-3 text-start"
                dir="rtl"
                required
              >
                <option value="">{t("adminProvinces.selectProvince")}</option>
                {provinces.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>{t("adminProvinces.order")}</Label>
              <Input
                type="number"
                value={cityForm.sortOrder}
                onChange={(e) =>
                  setCityForm((f) => ({
                    ...f,
                    sortOrder: Number(e.target.value),
                  }))
                }
                dir="ltr"
                className="text-left"
              />
            </div>
            <DialogFooter className="flex flex-row-reverse gap-2">
              <Button type="button" variant="outline" onClick={() => setCityDialogOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button type="submit">
                {editingCity ? t("common.save") : t("adminProvinces.addCity")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
