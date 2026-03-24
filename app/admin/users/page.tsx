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
import { isValidPublicUsername, normalizeUsername } from "@/lib/username";
import {
  UserPlus,
  UserCircle,
  MoreHorizontal,
  Key,
  Eye,
  EyeOff,
  Check,
  Circle,
  RefreshCcw,
  Coins,
  Copy,
  CheckCircle2,
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
  username: string;
  role?: string;
  tokenBalance?: number;
  createdAt: string | Date;
  _count: { reports: number };
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState<"user" | "validator">("user");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState("");
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [addUserUsername, setAddUserUsername] = useState("");
  const [addUserName, setAddUserName] = useState("");
  const [addUserRole, setAddUserRole] = useState<"user" | "validator">("user");
  const [addUserLoading, setAddUserLoading] = useState(false);
  const [addUserError, setAddUserError] = useState("");
  const [addUserCredentials, setAddUserCredentials] = useState<{
    username: string;
    password: string;
    displayName: string;
    role: string;
  } | null>(null);
  const [addUserShowPassword, setAddUserShowPassword] = useState(false);
  const [addUserCopied, setAddUserCopied] = useState<"username" | "password" | "both" | null>(null);
  const [passwordModalUser, setPasswordModalUser] = useState<User | null>(null);
  const [pwPassword, setPwPassword] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [pwShow, setPwShow] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState("");
  const [tokenModalUser, setTokenModalUser] = useState<User | null>(null);
  const [tokenAmount, setTokenAmount] = useState("");
  const [tokenLoading, setTokenLoading] = useState(false);
  const [tokenError, setTokenError] = useState("");

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
    const body: {
      username?: string;
      name?: string;
      expiresInDays?: number;
      role?: "user" | "validator";
    } = {
      expiresInDays: 7,
      role: inviteRole,
    };
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

  const copyProvisionText = async (text: string, kind: "username" | "password" | "both") => {
    try {
      await navigator.clipboard.writeText(text);
      setAddUserCopied(kind);
      window.setTimeout(() => setAddUserCopied(null), 2000);
    } catch {
      /* ignore */
    }
  };

  const handleProvisionUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const u = normalizeUsername(addUserUsername);
    if (!u || !isValidPublicUsername(u)) {
      setAddUserError(
        "نام کاربری معتبر نیست: ۳ تا ۳۲ کاراکتر، فقط حروف کوچک انگلیسی، عدد و زیرخط (بدون dn_).",
      );
      return;
    }
    setAddUserLoading(true);
    setAddUserError("");
    const body: { username: string; name?: string; role?: "user" | "validator" } = {
      username: u,
      role: addUserRole,
    };
    if (addUserName?.trim()) body.name = addUserName.trim();
    const { data, error } = await api.admin.users.provision.post(body);
    setAddUserLoading(false);
    if (error) {
      setAddUserError((error as { message?: string })?.message ?? "خطای ناشناخته");
      return;
    }
    const d = data as { username?: string; password?: string; name?: string; role?: string };
    if (d?.username && d?.password) {
      setAddUserCredentials({
        username: d.username,
        password: d.password,
        displayName: d.name ?? d.username,
        role: d.role === "validator" ? "اعتبارسنج" : "کاربر",
      });
      setAddUserShowPassword(false);
    }
    await load();
  };

  const resetAddUserForm = () => {
    setAddUserCredentials(null);
    setAddUserError("");
    setAddUserUsername("");
    setAddUserName("");
    setAddUserRole("user");
    setAddUserShowPassword(false);
    setAddUserCopied(null);
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

  const openAddTokensModal = (user: User) => {
    setTokenModalUser(user);
    setTokenAmount("");
    setTokenError("");
  };

  const handleAddTokens = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenModalUser) return;
    const n = Number.parseInt(tokenAmount, 10);
    if (!Number.isFinite(n) || n < 1) {
      setTokenError("مقدار باید عدد صحیح حداقل ۱ باشد.");
      return;
    }
    if (n > 1_000_000) {
      setTokenError("حداکثر ۱٬۰۰۰٬۰۰۰ توکن در هر بار مجاز است.");
      return;
    }
    setTokenLoading(true);
    setTokenError("");
    const { error } = await api.admin.users({ id: tokenModalUser.id }).tokens.post({
      amount: n,
    });
    setTokenLoading(false);
    if (error) {
      setTokenError((error as { message?: string })?.message ?? "خطا در افزودن توکن");
      return;
    }
    setTokenModalUser(null);
    setTokenAmount("");
    await load();
  };

  if (loading) return <div className="p-6">در حال بارگذاری...</div>;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="mb-6 text-2xl font-bold">کاربران</h1>

        <div className="mb-6 flex flex-wrap gap-3">
          <Dialog
            open={inviteOpen}
            onOpenChange={(open) => {
              setInviteOpen(open);
              if (open) {
                setInviteSuccess("");
                setInviteRole("user");
              }
            }}
          >
            <DialogTrigger asChild>
              <Button variant="default">
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
                  <Label>نام (اختیاری)</Label>
                  <Input
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder="نام کاربر"
                  />
                </div>
                <div>
                  <Label>نوع کاربر پس از ثبت‌نام</Label>
                  <Select
                    value={inviteRole}
                    onValueChange={(v) => setInviteRole(v as "user" | "validator")}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">کاربر</SelectItem>
                      <SelectItem value="validator">اعتبارسنج</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {inviteSuccess && <p className="text-muted-foreground text-sm">{inviteSuccess}</p>}
                <Button type="submit" disabled={inviteLoading}>
                  {inviteLoading ? "در حال ایجاد..." : "ایجاد دعوت"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog
            open={addUserOpen}
            onOpenChange={(open) => {
              setAddUserOpen(open);
              if (open) {
                resetAddUserForm();
              }
            }}
          >
            <DialogTrigger asChild>
              <Button variant="outline">
                <UserCircle className="ml-2 h-4 w-4" />
                افزودن کاربر
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {addUserCredentials ? "کاربر با موفقیت ایجاد شد" : "افزودن کاربر (رمز خودکار)"}
                </DialogTitle>
              </DialogHeader>

              {addUserCredentials ? (
                <div className="space-y-4">
                  <div className="border-border flex items-start gap-3 rounded-lg border bg-emerald-500/5 p-3 dark:bg-emerald-500/10">
                    <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <p className="text-muted-foreground text-xs leading-relaxed">
                      مشخصات ورود را فقط از مسیر امن در اختیار کاربر بگذارید.{" "}
                      <strong>در اولین ورود باید رمز جدید انتخاب کند</strong> و تا آن زمان به بخش‌های
                      اصلی اپ دسترسی ندارد.
                    </p>
                  </div>

                  <div className="text-muted-foreground flex flex-wrap gap-x-3 gap-y-1 text-xs">
                    <span>
                      نام نمایشی:{" "}
                      <span className="text-foreground font-medium">
                        {addUserCredentials.displayName}
                      </span>
                    </span>
                    <span>
                      نقش:{" "}
                      <span className="text-foreground font-medium">{addUserCredentials.role}</span>
                    </span>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">نام کاربری</Label>
                    <div className="flex gap-2">
                      <Input
                        readOnly
                        value={addUserCredentials.username}
                        className="font-mono text-sm"
                        dir="ltr"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="shrink-0"
                        onClick={() => copyProvisionText(addUserCredentials.username, "username")}
                        aria-label="کپی نام کاربری"
                      >
                        {addUserCopied === "username" ? (
                          <Check className="size-4 text-emerald-600" />
                        ) : (
                          <Copy className="size-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">رمز عبور یک‌بار مصرف</Label>
                    <div className="flex gap-2">
                      <Input
                        readOnly
                        value={addUserCredentials.password}
                        type={addUserShowPassword ? "text" : "password"}
                        className="font-mono text-sm tracking-wide"
                        dir="ltr"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="shrink-0"
                        onClick={() => setAddUserShowPassword((s) => !s)}
                        aria-label={addUserShowPassword ? "مخفی کردن رمز" : "نمایش رمز"}
                      >
                        {addUserShowPassword ? (
                          <EyeOff className="size-4" />
                        ) : (
                          <Eye className="size-4" />
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="shrink-0"
                        onClick={() => copyProvisionText(addUserCredentials.password, "password")}
                        aria-label="کپی رمز عبور"
                      >
                        {addUserCopied === "password" ? (
                          <Check className="size-4 text-emerald-600" />
                        ) : (
                          <Copy className="size-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full"
                    onClick={() =>
                      copyProvisionText(
                        `نام کاربری: ${addUserCredentials.username}\nرمز عبور: ${addUserCredentials.password}`,
                        "both",
                      )
                    }
                  >
                    {addUserCopied === "both" ? (
                      <>
                        <Check className="ml-2 size-4" />
                        کپی شد
                      </>
                    ) : (
                      <>
                        <Copy className="ml-2 size-4" />
                        کپی نام کاربری و رمز با هم
                      </>
                    )}
                  </Button>

                  <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                    <Button type="button" variant="outline" onClick={() => setAddUserOpen(false)}>
                      بستن
                    </Button>
                    <Button type="button" onClick={resetAddUserForm}>
                      افزودن کاربر دیگر
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleProvisionUser} className="space-y-4">
                  <p className="text-muted-foreground border-border bg-muted/40 rounded-md border p-3 text-xs leading-relaxed">
                    نام کاربری را شما تعیین می‌کنید؛ یک رمز عبور قوی به‌صورت خودکار ساخته و اینجا نشان
                    داده می‌شود. کاربر با همان رمز اولیه وارد می‌شود، اما{" "}
                    <strong>در اولین ورود حتماً باید رمز جدیدی انتخاب کند</strong>؛ تا آن زمان به
                    بخش‌های اصلی اپلیکیشن دسترسی نخواهد داشت.
                  </p>
                  {addUserError && (
                    <p className="text-destructive bg-destructive/10 rounded-md p-3 text-sm">
                      {addUserError}
                    </p>
                  )}
                  <div>
                    <Label>نام کاربری (الزامی)</Label>
                    <Input
                      value={addUserUsername}
                      onChange={(e) => setAddUserUsername(e.target.value)}
                      placeholder="my_username"
                      className="text-center font-mono"
                      dir="ltr"
                      autoComplete="off"
                      required
                    />
                    <p className="text-muted-foreground mt-1 text-xs">
                      ۳–۳۲ کاراکتر؛ فقط a-z، 0-9 و _؛ نمی‌تواند با dn_ شروع شود.
                    </p>
                  </div>
                  <div>
                    <Label>نام نمایشی (اختیاری)</Label>
                    <Input
                      value={addUserName}
                      onChange={(e) => setAddUserName(e.target.value)}
                      placeholder="مثلاً نام کاربر در سیستم — اگر خالی باشد همان نام کاربری ذخیره می‌شود"
                    />
                  </div>
                  <div>
                    <Label>نقش</Label>
                    <Select
                      value={addUserRole}
                      onValueChange={(v) => setAddUserRole(v as "user" | "validator")}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">کاربر</SelectItem>
                        <SelectItem value="validator">اعتبارسنج</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="submit"
                    disabled={
                      addUserLoading ||
                      !normalizeUsername(addUserUsername) ||
                      !isValidPublicUsername(normalizeUsername(addUserUsername))
                    }
                  >
                    {addUserLoading ? "در حال ایجاد..." : "ایجاد کاربر و نمایش مشخصات ورود"}
                  </Button>
                </form>
              )}
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
                <TableHead>تعداد توکن</TableHead>
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
                    <span dir="ltr">{u.username}</span>
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
                  <TableCell dir="ltr" className="text-end tabular-nums">
                    {u.tokenBalance ?? 0}
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
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openChangePasswordModal(u)}>
                          <Key className="ml-2 h-2 w-2" />
                          تغییر رمزعبور
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openAddTokensModal(u)}>
                          <Coins className="ml-2 h-2 w-2" />
                          افزودن توکن
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
                {passwordModalUser.username}) هستید.
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

      <Dialog
        open={!!tokenModalUser}
        onOpenChange={(open) => {
          if (!open) {
            setTokenModalUser(null);
            setTokenAmount("");
            setTokenError("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>افزودن توکن (پاداش)</DialogTitle>
          </DialogHeader>
          {tokenModalUser && (
            <form onSubmit={handleAddTokens} className="space-y-4">
              <p className="text-muted-foreground text-xs">
                توکن به‌صورت پاداش به کاربر <span className="font-bold">{tokenModalUser.name}</span>{" "}
                (<span dir="ltr">{tokenModalUser.username}</span>) اضافه می‌شود و در سابقه تراکنش‌های
                او با عنوان «پاداش» ثبت می‌شود. موجودی فعلی:{" "}
                <span dir="ltr" className="font-mono tabular-nums">
                  {tokenModalUser.tokenBalance ?? 0}
                </span>
              </p>
              <div className="space-y-2">
                <Label htmlFor="token-amount">تعداد توکن</Label>
                <Input
                  id="token-amount"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={1_000_000}
                  placeholder="مثلاً ۱۰"
                  value={tokenAmount}
                  onChange={(e) => setTokenAmount(e.target.value)}
                  className="text-center font-mono"
                  dir="ltr"
                  required
                />
              </div>
              {tokenError && <p className="text-destructive text-sm">{tokenError}</p>}
              <div className="flex w-full justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setTokenModalUser(null);
                    setTokenAmount("");
                    setTokenError("");
                  }}
                >
                  انصراف
                </Button>
                <Button type="submit" size="sm" disabled={tokenLoading}>
                  {tokenLoading ? "در حال ثبت..." : "ثبت پاداش"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
