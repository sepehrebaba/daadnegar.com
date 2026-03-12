"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/edyen";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Mail, UserPlus } from "lucide-react";

type User = {
  id: string;
  name: string;
  email: string;
  role?: string;
  createdAt: string;
  _count: { reports: number };
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState("");

  const load = async () => {
    const { data, error } = await api.admin.users.get();
    if (!error && data?.data) setUsers(data.data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteLoading(true);
    setInviteSuccess("");
    const body: { email?: string; name?: string; expiresInDays?: number } = {
      expiresInDays: 7,
    };
    if (inviteEmail?.trim()) body.email = inviteEmail.trim();
    if (inviteName?.trim()) body.name = inviteName.trim();
    const { data, error } = await api.admin.invitations.post(body);
    setInviteLoading(false);
    if (error) {
      setInviteSuccess(`خطا: ${error.message}`);
      return;
    }
    const code = (data as { code?: string })?.code;
    const link = (data as { inviteLink?: string })?.inviteLink;
    setInviteSuccess(
      code && link
        ? `کد دعوت: ${code}\nلینک: ${link}`
        : code
          ? `کد دعوت: ${code}`
          : "دعوت ایجاد شد.",
    );
  };

  const handleRoleChange = async (userId: string, role: "user" | "validator") => {
    const { error } = await api.admin.users({ id: userId }).role.put({ role });
    if (!error) load();
  };

  if (loading) return <div className="p-6">در حال بارگذاری...</div>;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">کاربران</h1>

      <div className="mb-6 flex gap-4">
        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="ml-2 h-4 w-4" />
              دعوت کاربر
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>دعوت کاربر جدید</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <Label>ایمیل (اختیاری - برای دعوت عمومی خالی بگذارید)</Label>
                <Input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="user@example.com"
                  dir="ltr"
                />
              </div>
              <div>
                <Label>نام (اختیاری)</Label>
                <Input
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="نام کاربر"
                />
              </div>
              {inviteSuccess && <p className="text-muted-foreground text-sm">{inviteSuccess}</p>}
              <Button type="submit" disabled={inviteLoading}>
                {inviteLoading ? "در حال ایجاد..." : "ایجاد دعوت"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>لیست کاربران</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>نام</TableHead>
                <TableHead>ایمیل</TableHead>
                <TableHead>نقش</TableHead>
                <TableHead>تعداد گزارش</TableHead>
                <TableHead>تاریخ عضویت</TableHead>
                <TableHead>عملیات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>{u.name}</TableCell>
                  <TableCell>
                    <span dir="ltr">{u.email}</span>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={u.role ?? "user"}
                      onValueChange={(v) => handleRoleChange(u.id, v as "user" | "validator")}
                    >
                      <SelectTrigger className="w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">کاربر</SelectItem>
                        <SelectItem value="validator">اعتبارسنج</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>{u._count?.reports ?? 0}</TableCell>
                  <TableCell>
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString("fa-IR") : "-"}
                  </TableCell>
                  <TableCell>-</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
