"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { api, DAADNEGAR_INVITE_TOKEN_KEY } from "@/lib/edyen";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

type InviteCodeItem = {
  id: string;
  code: string;
  used: boolean;
  isActive: boolean;
  createdAt: string;
};

export function InviteUserScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [myCodes, setMyCodes] = useState<InviteCodeItem[]>([]);
  const [myCodesLoading, setMyCodesLoading] = useState(false);
  /** Incremented on modal reset/close so in-flight invite POST results are ignored. */
  const inviteModalGenerationRef = useRef(0);

  const resetModalState = () => {
    inviteModalGenerationRef.current += 1;
    setError("");
    setSuccessMessage("");
    setInviteCode("");
    setIsLoading(false);
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
    const generation = inviteModalGenerationRef.current;
    setError("");
    setSuccessMessage("");
    setInviteCode("");
    setIsLoading(true);

    const body = { type: "public" as const };
    const token =
      typeof window !== "undefined" ? localStorage.getItem(DAADNEGAR_INVITE_TOKEN_KEY) : null;
    const opts = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    const { data, error: inviteError } = await api.invite["invite-user"].post(body, opts);

    if (generation !== inviteModalGenerationRef.current) return;

    if (inviteError) {
      const errObj = inviteError as {
        value?: { error?: { message?: string } };
        message?: string;
      };
      const errMsg = errObj?.value?.error?.message ?? errObj?.message ?? t("inviteUser.error");
      toast.error(errMsg);

      setError(errMsg);
      setIsLoading(false);
      return;
    }
    if (data && !(data as { ok?: boolean }).ok) {
      setError((data as { error?: string })?.error || t("inviteUser.error"));
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
    setSuccessMessage(t("inviteUser.success"));
    setIsLoading(false);
    void fetchMyCodes();
  };

  return (
    <div className="bg-background container mx-auto flex flex-col items-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-foreground text-xl font-bold">
            {t("inviteUser.title")}
          </CardTitle>
          <CardDescription>{t("inviteUser.description")}</CardDescription>
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
            {t("inviteUser.createInvite")}
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
                  {t("inviteUser.dialogTitle")}
                </DialogTitle>
              </DialogHeader>
              <div className="border-border my-0.5 border-t" />
              <form onSubmit={handleCreateInvite} className="space-y-4">
                <Alert size="xs" variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{t("inviteUser.warning")}</AlertDescription>
                </Alert>
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
                        {t("inviteUser.inviteCodeLabel")}
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
                                <span className="text-green-600 dark:text-green-500">
                                  {t("common.copied")}
                                </span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-4 w-4" />
                                {t("common.copy")}
                              </>
                            )}
                          </Button>
                        </InputGroupAddon>
                      </InputGroup>

                      <Alert variant="default">
                        <InfoIcon className="h-4 w-4 shrink-0" />
                        <AlertTitle className="text-xs">{t("inviteUser.infoTitle")}</AlertTitle>
                        <AlertDescription className="text-xs">
                          {t("inviteUser.infoDescription")}
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
                    {t("common.close")}
                  </Button>
                ) : (
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? t("inviteUser.submitting") : t("inviteUser.submit")}
                  </Button>
                )}
              </form>
            </DialogContent>
          </Dialog>

          {/* Created invite codes list */}
          <div className="bg-card border-border mt-6 w-full max-w-md overflow-hidden rounded-lg border">
            <div className="border-border border-b px-4 py-3">
              <h3 className="text-foreground flex items-center gap-2 font-semibold">
                <Ticket className="h-4 w-4" />
                {t("inviteUser.myCodes")}
              </h3>
            </div>
            {myCodesLoading ? (
              <div className="text-muted-foreground p-6 text-center text-sm">
                {t("common.loading")}
              </div>
            ) : myCodes.length === 0 ? (
              <div className="text-muted-foreground p-6 text-center text-sm">
                {t("inviteUser.noCodesYet")}
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
                              <span className="text-green-600 dark:text-green-500">
                                {t("common.copied")}
                              </span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" />
                              {t("common.copy")}
                            </>
                          )}
                        </Button>

                        <p
                          dir="ltr"
                          className="text-muted-foreground col-span-2 mr-auto ml-2 truncate text-xs"
                        >
                          {t("inviteUser.public")}
                        </p>
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
                              {t("inviteUser.used")}
                            </>
                          ) : (
                            <>
                              <Ticket className="h-3 w-3 shrink-0" />
                              {t("inviteUser.free")}
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
            {t("common.back")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
