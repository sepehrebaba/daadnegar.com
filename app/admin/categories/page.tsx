"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/edyen";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { Plus, Pencil, Trash2, ChevronRight, ChevronDown } from "lucide-react";

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  type: string;
  sortOrder: number;
  isActive: boolean;
  parentId: string | null;
};

type CategoryNode = Category & { children: CategoryNode[] };

function buildTree(items: Category[]): CategoryNode[] {
  const map = new Map<string, CategoryNode>();
  for (const c of items) {
    map.set(c.id, { ...c, children: [] });
  }
  const roots: CategoryNode[] = [];
  const sorted = [...items].sort((a, b) => a.sortOrder - b.sortOrder);
  for (const c of sorted) {
    const node = map.get(c.id)!;
    if (!c.parentId) {
      roots.push(node);
    } else {
      const parent = map.get(c.parentId);
      if (parent) parent.children.push(node);
      else roots.push(node);
    }
  }
  const sort = (nodes: CategoryNode[]) => nodes.sort((a, b) => a.sortOrder - b.sortOrder);
  sort(roots);
  for (const n of map.values()) sort(n.children);
  return roots;
}

export default function AdminCategoriesPage() {
  const [data, setData] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    type: "report",
    sortOrder: 0,
    isActive: true,
    parentId: null as string | null,
  });

  const load = async () => {
    const { data: res, error } = await api.admin.categories.get();
    if (error) return;
    setData(res?.data ?? []);
  };

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({
      name: "",
      slug: "",
      description: "",
      type: "report",
      sortOrder: data.length,
      isActive: true,
      parentId: null,
    });
    setDialogOpen(true);
  };

  const openEdit = (c: Category) => {
    setEditing(c);
    setForm({
      name: c.name,
      slug: c.slug,
      description: c.description ?? "",
      type: c.type,
      sortOrder: c.sortOrder,
      isActive: c.isActive,
      parentId: c.parentId,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      const { error } = await api.admin.categories({ id: editing.id }).put({
        name: form.name,
        slug: form.slug,
        description: form.description || undefined,
        type: form.type,
        sortOrder: form.sortOrder,
        isActive: form.isActive,
        parentId: form.parentId,
      });
      if (!error) {
        setDialogOpen(false);
        load();
      }
    } else {
      const { error } = await api.admin.categories.post({
        name: form.name,
        slug: form.slug,
        description: form.description || undefined,
        type: form.type,
        sortOrder: form.sortOrder,
        isActive: form.isActive,
        parentId: form.parentId || undefined,
      });
      if (!error) {
        setDialogOpen(false);
        load();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("حذف این دسته‌بندی؟")) return;
    const { error } = await api.admin.categories({ id }).delete();
    if (!error) load();
  };

  const handleToggleActive = async (c: Category, checked: boolean) => {
    const { error } = await api.admin.categories({ id: c.id }).put({
      name: c.name,
      slug: c.slug,
      description: c.description || undefined,
      type: c.type,
      sortOrder: c.sortOrder,
      isActive: checked,
      parentId: c.parentId,
    });
    if (!error) load();
  };

  const parents = data.filter((c) => !c.parentId);
  const tree = buildTree(data);

  const toggleExpand = (id: string) => {
    setExpanded((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const renderRow = (node: CategoryNode, depth: number) => {
    const hasChildren = node.children.length > 0;
    const isExpanded = expanded.has(node.id);
    const nameCell = (
      <TableCell className="w-full">
        <div
          role={hasChildren ? "button" : undefined}
          tabIndex={hasChildren ? 0 : undefined}
          className={`flex min-w-0 items-center gap-1 ${hasChildren ? "hover:bg-muted/50 w-full cursor-pointer rounded select-none" : ""}`}
          style={{ paddingInlineStart: depth * 24 }}
          onClick={hasChildren ? () => toggleExpand(node.id) : undefined}
          onKeyDown={
            hasChildren
              ? (e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggleExpand(node.id);
                  }
                }
              : undefined
          }
          aria-label={hasChildren ? (isExpanded ? "بستن" : "باز کردن") : undefined}
        >
          {hasChildren ? (
            <span className="shrink-0">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </span>
          ) : (
            <span className="w-5 shrink-0" />
          )}
          <span className="min-w-0 truncate">{node.name}</span>
        </div>
      </TableCell>
    );
    return (
      <>
        <TableRow key={node.id}>
          {nameCell}
          <TableCell>{node.slug}</TableCell>
          <TableCell>{node.type}</TableCell>
          <TableCell>{node.sortOrder}</TableCell>
          <TableCell>
            <Switch
              checked={node.isActive}
              onCheckedChange={(checked) => handleToggleActive(node, checked)}
            />
          </TableCell>
          <TableCell className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => openEdit(node)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleDelete(node.id)}>
              <Trash2 className="text-destructive h-4 w-4" />
            </Button>
          </TableCell>
        </TableRow>
        {hasChildren &&
          isExpanded &&
          node.children.map((c) => (
            <React.Fragment key={c.id}>{renderRow(c, depth + 1)}</React.Fragment>
          ))}
      </>
    );
  };

  if (loading) return <div className="p-6">در حال بارگذاری...</div>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">دسته‌بندی‌ها</h1>
        <Button onClick={openCreate}>
          <Plus className="ml-2 h-4 w-4" />
          افزودن
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>لیست دسته‌بندی‌ها</CardTitle>
        </CardHeader>
        <CardContent>
          <Table className="w-full min-w-full table-fixed">
            <colgroup>
              <col style={{ width: "40%" }} />
              <col style={{ width: "20%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "8%" }} />
              <col style={{ width: "8%" }} />
              <col style={{ width: "12%" }} />
            </colgroup>
            <TableHeader>
              <TableRow>
                <TableHead>نام</TableHead>
                <TableHead>اسلاگ</TableHead>
                <TableHead>نوع</TableHead>
                <TableHead>ترتیب</TableHead>
                <TableHead>فعال</TableHead>
                <TableHead>عملیات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>{tree.map((node) => renderRow(node, 0))}</TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "ویرایش دسته‌بندی" : "افزودن دسته‌بندی"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>نام</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label>اسلاگ</Label>
              <Input
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                required
                dir="ltr"
                className="text-left"
              />
            </div>
            <div>
              <Label>توضیحات</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div>
              <Label>نوع</Label>
              <Input
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              />
            </div>
            <div>
              <Label>ترتیب</Label>
              <Input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.isActive}
                onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: !!v }))}
              />
              <Label>فعال</Label>
            </div>
            <div>
              <Label>والد (اختیاری)</Label>
              <select
                className="border-input h-9 w-full rounded-md border px-3"
                value={form.parentId ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, parentId: e.target.value || null }))}
              >
                <option value="">بدون والد</option>
                {parents.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                انصراف
              </Button>
              <Button type="submit">{editing ? "ذخیره" : "افزودن"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
