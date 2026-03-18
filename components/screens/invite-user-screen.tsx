"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api, DAADNEGAR_INVITE_TOKEN_KEY } from "@/lib/edyen";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertCircle,
  CheckCircle,
  InfoIcon,
  Copy,
  Check,
  UserCheck,
  Ticket,
  UserPlus,
} from "lucide-react";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { formatTimeAgo } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";

type InviteCodeItem = {
  id: string;
  code: string;
  used: boolean;
  invitedEmail: string | null;
  isActive: boolean;
  createdAt: string;
};

type InviteType = "personal" | "public";

export function InviteUserScreen() {
  const router = useRouter();
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteType, setInviteType] = useState<InviteType>("personal");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [myCodes, setMyCodes] = useState<InviteCodeItem[]>([]);
  const [myCodesLoading, setMyCodesLoading] = useState(false);

  const resetModalState = () => {
    setError("");
    setSuccessMessage("");
    setInviteCode("");
    setEmail("");
  };

  const fetchMyCodes = useCallback(async () => {
    setMyCodesLoading(true);
    const { data, error: fetchError } = await api.invite["my-codes"].get();
    setMyCodesLoading(false);
    if (!fetchError && Array.isArray(data)) setMyCodes(data);
  }, []);

  useEffect(() => {
    void fetchMyCodes();
  }, [fetchMyCodes]);

  const copyToClipboard = useCallback(
    async (code?: string) => {
      const target = code ?? inviteCode;
      if (!target) return;
      try {
        await navigator.clipboard.writeText(target);
        setCopiedCode(target);
        setTimeout(() => setCopiedCode(null), 2000);
      } catch {
        const ta = document.createElement("textarea");
        ta.value = target;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        setCopiedCode(target);
        setTimeout(() => setCopiedCode(null), 2000);
      }
    },
    [inviteCode],
  );

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inviteType === "personal" && !email.trim()) {
      setError("برای دعوت اختصاصی، ایمیل الزامی است.");
      return;
    }
    setError("");
    setSuccessMessage("");
    setInviteCode("");
    setIsLoading(true);

    const trimmedEmail = email.trim();
    const body =
      inviteType === "personal" && trimmedEmail
        ? { type: "personal" as const, email: trimmedEmail }
        : { type: "public" as const };
    const token =
      typeof window !== "undefined" ? localStorage.getItem(DAADNEGAR_INVITE_TOKEN_KEY) : null;
    const opts = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    const { data, error: inviteError } = await api.invite["invite-user"].post(body, opts);

    if (inviteError) {
      const errObj = inviteError as {
        value?: { error?: { message?: string } };
        message?: string;
      };
      const errMsg = errObj?.value?.error?.message ?? errObj?.message ?? "خطا در ارسال دعوت.";
      setError(errMsg);
      setIsLoading(false);
      return;
    }
    if (data && !(data as { ok?: boolean }).ok) {
      setError((data as { error?: string })?.error || "خطا در ارسال دعوت.");
      setIsLoading(false);
      return;
    }

    const res = data as {
      ok?: boolean;
      code?: string;
      registerLink?: string;
    } | null;
    const code = res?.code ?? "";
    setInviteCode(code);
    setSuccessMessage("کد دعوت با موفقیت ایجاد شد. این کد یک‌بار مصرف است.");
    setEmail("");
    setIsLoading(false);
    void fetchMyCodes();
  };

  return (
    <div className="bg-background container mx-auto flex flex-col items-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-foreground text-xl font-bold">دعوت کاربر</CardTitle>
          <CardDescription>کد دعوت ایجاد کنید یا از کدهای قبلی خود استفاده کنید</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={() => {
              resetModalState();
              setInviteModalOpen(true);
            }}
            className="w-full gap-2 py-6"
            size="lg"
          >
            <UserPlus className="h-5 w-5" />
            ایجاد کد دعوت
          </Button>

          <Dialog
            open={inviteModalOpen}
            onOpenChange={(open) => {
              setInviteModalOpen(open);
              if (!open) resetModalState();
            }}
          >
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-foreground text-xl font-black">
                  ایجاد کد دعوت
                </DialogTitle>
                <DialogDescription>نوع کد دعوت را انتخاب کنید</DialogDescription>
              </DialogHeader>
              <div className="border-border my-0.5 border-t" />
              <form onSubmit={handleCreateInvite} className="space-y-4">
                {!inviteCode && (
                  <>
                    <div className="space-y-3">
                      <Label className="text-foreground text-sm font-bold">نوع کد دعوت</Label>
                      <RadioGroup
                        value={inviteType}
                        onValueChange={(v) => setInviteType(v as InviteType)}
                        className="flex flex-col gap-2"
                      >
                        <div className="border-border bg-muted/30 flex items-center gap-3 rounded-lg border p-3">
                          <RadioGroupItem value="personal" id="type-personal" />
                          <Label htmlFor="type-personal" className="flex-1 cursor-pointer text-xs">
                            اختصاصی (مخصوص یک ایمیل)
                          </Label>
                        </div>
                        <div className="border-border bg-muted/30 flex items-center gap-3 rounded-lg border p-3">
                          <RadioGroupItem value="public" id="type-public" />
                          <Label htmlFor="type-public" className="flex-1 cursor-pointer text-xs">
                            عمومی (هرکسی می‌تواند استفاده کند)
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-foreground text-sm font-bold" htmlFor="modal-email">
                        ایمیل
                        {inviteType === "public" && (
                          <p className="text-muted-foreground text-[10px] font-normal">
                            (برای دعوت عمومی، نیازی به ایمیل نیست)
                          </p>
                        )}
                      </Label>
                      <Input
                        id="modal-email"
                        type="email"
                        placeholder="user@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="text-center"
                        dir="ltr"
                        disabled={inviteType === "public"}
                      />
                    </div>

                    {error && (
                      <Alert variant="error">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <AlertDescription className="text-xs">{error}</AlertDescription>
                      </Alert>
                    )}
                  </>
                )}

                {successMessage && inviteCode && (
                  <div className="space-y-3 rounded-lg border border-green-200 bg-green-50/50 p-4 dark:border-green-900/50 dark:bg-green-950/20">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-green-600 dark:text-green-500" />
                      <span className="text-foreground text-sm font-semibold">
                        {successMessage}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground relative -bottom-1 text-xs">
                        کد دعوت
                      </Label>
                      <InputGroup>
                        <InputGroupInput
                          value={inviteCode}
                          readOnly
                          className="text-center text-lg font-bold tracking-widest"
                          dir="ltr"
                        />
                        <InputGroupAddon align="inline-end">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard()}
                            className={
                              copiedCode === inviteCode
                                ? "gap-2 text-green-600! dark:text-green-500!"
                                : "gap-2"
                            }
                          >
                            {copiedCode === inviteCode ? (
                              <>
                                <Check className="h-4 w-4 shrink-0 text-green-600 dark:text-green-500" />
                                <span className="text-green-600 dark:text-green-500">کپی شد!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-4 w-4" />
                                کپی
                              </>
                            )}
                          </Button>
                        </InputGroupAddon>
                      </InputGroup>

                      <Alert variant="default">
                        <InfoIcon className="h-4 w-4 shrink-0" />
                        <AlertTitle className="text-xs">اطلاعات</AlertTitle>
                        <AlertDescription className="text-xs">
                          این کد دعوت یک‌بار مصرف است. هر کاربر می‌تواند از آن یک بار استفاده کند
                        </AlertDescription>
                      </Alert>
                    </div>
                  </div>
                )}

                <div className="border-border mt-2 mb-5 border-t" />

                {inviteCode ? (
                  <Button
                    type="button"
                    className="w-full"
                    onClick={() => {
                      setInviteModalOpen(false);
                      resetModalState();
                    }}
                  >
                    بستن
                  </Button>
                ) : (
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "در حال ایجاد..." : "ایجاد کد دعوت"}
                  </Button>
                )}
              </form>
            </DialogContent>
          </Dialog>

          {/* لیست کدهای دعوت ایجاد شده */}
          <div className="bg-card border-border mt-6 w-full max-w-md overflow-hidden rounded-lg border">
            <div className="border-border border-b px-4 py-3">
              <h3 className="text-foreground flex items-center gap-2 font-semibold">
                <Ticket className="h-4 w-4" />
                کدهای دعوت من
              </h3>
            </div>
            {myCodesLoading ? (
              <div className="text-muted-foreground p-6 text-center text-sm">
                در حال بارگذاری...
              </div>
            ) : myCodes.length === 0 ? (
              <div className="text-muted-foreground p-6 text-center text-sm">
                هنوز کد دعوتی ایجاد نکرده‌اید
              </div>
            ) : (
              <ScrollArea viewportClassName="max-h-[280px]">
                <ul className="divide-border divide-y">
                  {myCodes.map((item) => (
                    <li
                      key={item.id}
                      className="hover:bg-muted/30 grid grid-cols-[1fr_auto] gap-x-4 gap-y-1.5 px-4 py-4 align-middle transition-colors"
                    >
                      <div className="bg-muted-foreground/5 flex min-w-0 items-center gap-2 rounded-lg py-1">
                        <span
                          className="bg-muted rounded px-2.5 py-1 text-sm font-bold tracking-wider"
                          dir="ltr"
                        >
                          {item.code}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className={
                            copiedCode === item.code
                              ? "h-7 shrink-0 gap-1.5 px-2 text-green-600! dark:text-green-500!"
                              : "h-7 shrink-0 gap-1.5 px-2"
                          }
                          onClick={() => copyToClipboard(item.code)}
                        >
                          {copiedCode === item.code ? (
                            <>
                              <Check className="h-3.5 w-3.5 shrink-0 text-green-600 dark:text-green-500" />
                              <span className="text-green-600 dark:text-green-500">کپی شد!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" />
                              کپی
                            </>
                          )}
                        </Button>

                        {item.invitedEmail ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <p
                                className="text-muted-foreground col-span-2 mr-auto ml-2 truncate text-xs"
                                dir="ltr"
                                title={item.invitedEmail}
                              >
                                مخصوص
                              </p>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{item.invitedEmail}</p>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <p
                            dir="ltr"
                            className="text-muted-foreground col-span-2 mr-auto ml-2 truncate text-xs"
                          >
                            عمومی
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-3 self-center">
                        <span
                          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium ${
                            item.used
                              ? "bg-muted text-muted-foreground"
                              : "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400"
                          }`}
                        >
                          {item.used ? (
                            <>
                              <UserCheck className="h-3 w-3 shrink-0" />
                              استفاده شده
                            </>
                          ) : (
                            <>
                              <Ticket className="h-3 w-3 shrink-0" />
                              آزاد
                            </>
                          )}
                        </span>
                        <span className="text-muted-foreground shrink-0 text-[9px]">
                          {formatTimeAgo(item.createdAt)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            )}
          </div>

          <Button type="button" onClick={() => router.back()} variant="ghost" className="w-full">
            بازگشت
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
