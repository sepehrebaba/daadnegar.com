"use client";

import { useEffect, useState } from "react";
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
import { Plus, Trash2 } from "lucide-react";

type IpRow = { id: string; ipAddress: string; createdAt: string };

export default function AdminIpWhitelistPage() {
  const [ips, setIps] = useState<IpRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newIp, setNewIp] = useState("");

  const fetchIps = async () => {
    const { data } = await api.admin["ip-whitelist"].get();
    setIps(data?.data ?? []);
  };

  useEffect(() => {
    fetchIps().finally(() => setLoading(false));
  }, []);

  const addIp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIp.trim()) return;
    await api.admin["ip-whitelist"].post({ ipAddress: newIp.trim() });
    setNewIp("");
    setDialogOpen(false);
    fetchIps();
  };

  const removeIp = async (id: string) => {
    if (!confirm("آیا از حذف این IP مطمئن هستید؟")) return;
    await api.admin["ip-whitelist"]({ id }).delete();
    fetchIps();
  };

  return (
    <div dir="rtl" className="text-right">
      <h1 className="mb-6 text-2xl font-bold">IP های مجاز</h1>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 space-x-4">
          <CardTitle>لیست IP های مجاز</CardTitle>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="me-2 h-4 w-4" />
            افزودن IP
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4 text-sm">
            فقط از این IPها می‌توان به پنل ادمین وارد شد. فرمت: آدرس دقیق (مثل 192.168.1.1) یا شبکه
            (مثل 192.168.1.0/24)
          </p>
          {loading ? (
            <p>در حال بارگذاری...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">IP</TableHead>
                  <TableHead className="text-right">تاریخ</TableHead>
                  <TableHead className="w-16 text-right">عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ips.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="text-right" dir="ltr">
                      {row.ipAddress}
                    </TableCell>
                    <TableCell className="text-right">
                      {new Date(row.createdAt).toLocaleDateString("fa-IR")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => removeIp(row.id)}>
                        <Trash2 className="text-destructive h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent dir="rtl" className="text-right">
          <DialogHeader>
            <DialogTitle>افزودن IP مجاز</DialogTitle>
          </DialogHeader>
          <form onSubmit={addIp} className="space-y-4">
            <div>
              <Label>آدرس IP یا شبکه</Label>
              <Input
                value={newIp}
                onChange={(e) => setNewIp(e.target.value)}
                placeholder="192.168.1.1 یا 192.168.1.0/24"
                required
                dir="ltr"
                className="text-left"
              />
            </div>
            <DialogFooter className="flex-row-reverse gap-2 sm:gap-0">
              <Button type="submit">افزودن</Button>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                انصراف
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
