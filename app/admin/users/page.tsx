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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  isPasswordSecure,
  getPasswordStrength,
  generateRandomPassword,
  PASSWORD_RULES,
} from "@/lib/password-utils";
import {
  UserPlus,
  MoreHorizontal,
  Key,
  Eye,
  EyeOff,
  Check,
  Circle,
  RefreshCcw,
} from "lucide-react";

const PASSWORD_REQUIREMENTS = [
  {
    key: "minLength" as const,
    label: "حداقل ۸ کاراکتر",
    check: (p: string) => p.length >= PASSWORD_RULES.minLength,
  },
  {
    key: "hasUppercase" as const,
    label: "یک حرف بزرگ (A-Z)",
    check: (p: string) => /[A-Z]/.test(p),
  },
  {
    key: "hasLowercase" as const,
    label: "یک حرف کوچک (a-z)",
    check: (p: string) => /[a-z]/.test(p),
  },
  {
    key: "hasNumber" as const,
    label: "یک عدد (0-9)",
    check: (p: string) => /[0-9]/.test(p),
  },
  {
    key: "hasSpecial" as const,
    label: "یک کاراکتر خاص (!@#$%)",
    check: (p: string) => /[$@#!%*?&#^()[\]{}_\-+=.,:;]/.test(p),
  },
];

type User = {
  id: string;
  name: string;
  email: string;
  role?: string;
  createdAt: string | Date;
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
  const [passwordModalUser, setPasswordModalUser] = useState<User | null>(null);
  const [pwPassword, setPwPassword] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [pwShow, setPwShow] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState("");

  const load = async () => {
    const { data, error } = await api.admin.users.get();
    if (!error && data?.data) setUsers(data.data as User[]);
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
      setInviteSuccess(`خطا: ${(error as { message?: string })?.message ?? "خطای ناشناخته"}`);
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

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordModalUser) return;
    if (!isPasswordSecure(pwPassword)) {
      setPwError("لطفاً رمز عبوری امن انتخاب کنید و تمام قوانین را رعایت کنید.");
      return;
    }
    if (pwPassword !== pwConfirm) {
      setPwError("رمز عبور با تکرار آن یکسان نیست.");
      return;
    }
    setPwLoading(true);
    setPwError("");
    const usersApi = api.admin.users as (p: { id: string }) => {
      password: {
        put: (b: { password: string }) => Promise<{ error?: unknown }>;
      };
    };
    const { error } = await usersApi({ id: passwordModalUser.id }).password.put({
      password: pwPassword,
    });
    setPwLoading(false);
    if (error) {
      setPwError((error as { message?: string })?.message ?? "خطا در تغییر رمز عبور");
      return;
    }
    setPasswordModalUser(null);
    setPwPassword("");
    setPwConfirm("");
    setPwError("");
  };

  const handleGenerateRandomPassword = () => {
    const pwd = generateRandomPassword(14);
    setPwPassword(pwd);
    setPwConfirm(pwd);
    setPwShow(true);
  };

  const openChangePasswordModal = (user: User) => {
    setPasswordModalUser(user);
    setPwPassword("");
    setPwConfirm("");
    setPwShow(false);
    setPwError("");
  };

  if (loading) return <div className="p-6">در حال بارگذاری...</div>;

  return (
    <div>
      <div className="flex items-center justify-between">
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
      </div>

      <Card>
        <CardHeader>
          <CardTitle>لیست کاربران</CardTitle>
        </CardHeader>
        <CardContent dir="rtl">
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
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="xs" className="text-xs">
                          <MoreHorizontal className="h-2 w-2" />
                          گزینه‌ها
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem onClick={() => openChangePasswordModal(u)}>
                          <Key className="ml-2 h-2 w-2" />
                          تغییر رمزعبور
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog
        open={!!passwordModalUser}
        onOpenChange={(open) => {
          if (!open) {
            setPasswordModalUser(null);
            setPwPassword("");
            setPwConfirm("");
            setPwError("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تغییر رمز عبور</DialogTitle>
          </DialogHeader>
          {passwordModalUser && (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <p className="text-muted-foreground text-xs">
                شما در حال تغییر رمز عبور برای کاربر:
                <span className="font-bold">{passwordModalUser.name}</span> (
                {passwordModalUser.email}) هستید.
              </p>
              <div className="space-y-2">
                <Label htmlFor="pw-password">رمز عبور جدید</Label>
                <InputGroup>
                  <InputGroupInput
                    id="pw-password"
                    type={pwShow ? "text" : "password"}
                    placeholder="••••••••"
                    value={pwPassword}
                    onChange={(e) => setPwPassword(e.target.value)}
                    className="text-center"
                    dir="ltr"
                    minLength={PASSWORD_RULES.minLength}
                    required
                    aria-invalid={pwPassword.length > 0 && !isPasswordSecure(pwPassword)}
                  />
                  <InputGroupAddon align="inline-end">
                    <InputGroupButton
                      type="button"
                      size="icon-xs"
                      variant="ghost"
                      onClick={() => setPwShow((p) => !p)}
                      aria-label={pwShow ? "مخفی کردن رمز عبور" : "نمایش رمز عبور"}
                    >
                      {pwShow ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </InputGroupButton>
                  </InputGroupAddon>
                </InputGroup>
                {pwPassword.length > 0 && (
                  <div className="space-y-1.5">
                    <Progress value={getPasswordStrength(pwPassword)} className="h-1.5" />
                    <ul className="text-muted-foreground space-y-0.5 text-xs">
                      {PASSWORD_REQUIREMENTS.map(({ key, label, check }) => (
                        <li key={key} className="flex items-center gap-2">
                          {check(pwPassword) ? (
                            <Check className="size-3.5 shrink-0 text-green-600 dark:text-green-500" />
                          ) : (
                            <Circle className="size-3 shrink-0 opacity-40" />
                          )}
                          {label}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="pw-confirm">تکرار رمز عبور</Label>
                <InputGroup>
                  <InputGroupInput
                    id="pw-confirm"
                    type={pwShow ? "text" : "password"}
                    placeholder="••••••••"
                    value={pwConfirm}
                    onChange={(e) => setPwConfirm(e.target.value)}
                    className="text-center"
                    dir="ltr"
                    required
                    aria-invalid={pwConfirm.length > 0 && pwPassword !== pwConfirm}
                  />
                  <InputGroupAddon align="inline-end">
                    <InputGroupButton
                      type="button"
                      size="icon-xs"
                      variant="ghost"
                      onClick={() => setPwShow((p) => !p)}
                      aria-label={pwShow ? "مخفی کردن رمز عبور" : "نمایش رمز عبور"}
                    >
                      {pwShow ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </InputGroupButton>
                  </InputGroupAddon>
                </InputGroup>
                {pwConfirm.length > 0 && pwPassword !== pwConfirm && (
                  <p className="text-destructive text-xs">رمز عبور با تکرار آن یکسان نیست</p>
                )}
              </div>
              {pwError && <p className="text-destructive text-sm">{pwError}</p>}

              <div className="flex w-full justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateRandomPassword}
                >
                  <RefreshCcw className="h-2 w-2" /> تولید رمز تصادفی
                </Button>
                <Button
                  type="submit"
                  className="min-w-0 flex-1"
                  size="sm"
                  disabled={!isPasswordSecure(pwPassword) || pwPassword !== pwConfirm || pwLoading}
                >
                  {pwLoading ? "در حال تغییر..." : "تغییر رمز عبور"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
