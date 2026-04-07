"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, getPendingReportDetail } from "@/lib/edyen";
import { toPersianNum } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  ArrowRight,
  Building2,
  Calendar,
  Check,
  ClipboardCheck,
  FileText,
  MapPin,
  MessageSquare,
  User,
  X,
  Mail,
  CheckCheckIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";

const MIN_COMMENT_LEN = 10;

type ReportDetail = {
  id: string;
  title?: string | null;
  description: string;
  status: string;
  organizationType?: string | null;
  organizationName?: string | null;
  province?: string | null;
  city?: string | null;
  exactLocation?: string | null;
  occurrenceFrequency?: string | null;
  occurrenceDate?: string | null;
  hasEvidence?: boolean | null;
  evidenceTypes?: string | null;
  evidenceDescription?: string | null;
  wantsContact?: boolean | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  contactSocial?: string | null;
  createdAt: string;
  person: {
    id: string;
    firstName: string;
    lastName: string;
    nationalCode?: string | null;
    title?: string | null;
    isFamous?: boolean;
  };
  user: { id: string; name: string; username: string };
  category?: { id: string; name: string; slug: string } | null;
  subcategory?: { id: string; name: string; slug: string } | null;
  documents: { id: string; name: string; url: string }[];
  consensus?: {
    minReviews: number;
    acceptedVotes: number;
    rejectedVotes: number;
    goodFaithRejectVotes: number;
    badFaithRejectVotes: number;
    validatorVotesTotal: number;
    myReviewAction: string | null;
    myRejectionTier: string | null;
    myAcceptedAt: string | null;
  };
};

function InfoRow({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value?: string | null;
  icon?: React.ElementType;
}) {
  if (value == null || value === "") return null;
  return (
    <div className="flex items-start gap-2 text-sm">
      {Icon && <Icon className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />}
      <div>
        <span className="text-muted-foreground">{label}: </span>
        <span className="text-foreground">{value}</span>
      </div>
    </div>
  );
}

export function ApprovalDetailScreen() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const id = params?.id as string | undefined;
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectTier, setRejectTier] = useState<"good_faith" | "bad_faith">("good_faith");
  const [rejectCode, setRejectCode] = useState("R1");
  const [rejectComment, setRejectComment] = useState("");
  const [approveComment, setApproveComment] = useState("");
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [approveError, setApproveError] = useState<string | null>(null);
  const [rejectError, setRejectError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [acceptingReview, setAcceptingReview] = useState(false);

  const GOOD_FAITH_OPTIONS = [
    {
      value: "R1",
      label: t("approval.detail.rejectDialog.goodFaithOptions.R1"),
      hint: t("approval.detail.rejectDialog.goodFaithOptions.R1_hint"),
    },
    {
      value: "R2",
      label: t("approval.detail.rejectDialog.goodFaithOptions.R2"),
      hint: t("approval.detail.rejectDialog.goodFaithOptions.R2_hint"),
    },
    {
      value: "R3",
      label: t("approval.detail.rejectDialog.goodFaithOptions.R3"),
      hint: t("approval.detail.rejectDialog.goodFaithOptions.R3_hint"),
    },
    {
      value: "R4",
      label: t("approval.detail.rejectDialog.goodFaithOptions.R4"),
      hint: t("approval.detail.rejectDialog.goodFaithOptions.R4_hint"),
    },
    {
      value: "R5",
      label: t("approval.detail.rejectDialog.goodFaithOptions.R5"),
      hint: t("approval.detail.rejectDialog.goodFaithOptions.R5_hint"),
    },
  ];

  const BAD_FAITH_OPTIONS = [
    {
      value: "B1",
      label: t("approval.detail.rejectDialog.badFaithOptions.B1"),
      hint: t("approval.detail.rejectDialog.badFaithOptions.B1_hint"),
    },
    {
      value: "B2",
      label: t("approval.detail.rejectDialog.badFaithOptions.B2"),
      hint: t("approval.detail.rejectDialog.badFaithOptions.B2_hint"),
    },
    {
      value: "B3",
      label: t("approval.detail.rejectDialog.badFaithOptions.B3"),
      hint: t("approval.detail.rejectDialog.badFaithOptions.B3_hint"),
    },
    {
      value: "B4",
      label: t("approval.detail.rejectDialog.badFaithOptions.B4"),
      hint: t("approval.detail.rejectDialog.badFaithOptions.B4_hint"),
    },
    {
      value: "B5",
      label: t("approval.detail.rejectDialog.badFaithOptions.B5"),
      hint: t("approval.detail.rejectDialog.badFaithOptions.B5_hint"),
    },
    {
      value: "B6",
      label: t("approval.detail.rejectDialog.badFaithOptions.B6"),
      hint: t("approval.detail.rejectDialog.badFaithOptions.B6_hint"),
    },
  ];

  useEffect(() => {
    if (!id) return;
    getPendingReportDetail(id)
      .then((data) => {
        setReport(data as ReportDetail);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : t("approval.detail.loadError"));
      })
      .finally(() => setLoading(false));
  }, [id, t]);

  useEffect(() => {
    const opts = rejectTier === "good_faith" ? GOOD_FAITH_OPTIONS : BAD_FAITH_OPTIONS;
    if (!opts.some((o) => o.value === rejectCode)) {
      setRejectCode(opts[0].value);
    }
  }, [rejectTier, rejectCode]);

  const reloadDetail = async () => {
    if (!id) return;
    try {
      const data = await getPendingReportDetail(id);
      setReport(data as ReportDetail);
      setError(null);
    } catch {
      router.push("/panel/approval-list");
    }
  };

  const handleAcceptReview = async () => {
    if (!id) return;
    setError(null);
    setAcceptingReview(true);
    try {
      await api.reports({ id })["accept-review"].put();
      await reloadDetail();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("approval.detail.acceptReviewError"));
    }
    setAcceptingReview(false);
  };

  const handleApprove = async () => {
    if (!id) return;
    const c = approveComment.trim();
    if (c.length < MIN_COMMENT_LEN) {
      setApproveError(t("approval.detail.approveDialog.minLength", { min: MIN_COMMENT_LEN }));
      return;
    }
    setApproveError(null);
    setActionLoading(true);
    try {
      await api.reports({ id }).approve.put({ comment: c });
      setApproveDialogOpen(false);
      setApproveComment("");
      await reloadDetail();
    } catch (e) {
      setApproveError(e instanceof Error ? e.message : t("approval.detail.approveDialog.error"));
    }
    setActionLoading(false);
  };

  const handleReject = async () => {
    if (!id) return;
    const c = rejectComment.trim();
    if (c.length < MIN_COMMENT_LEN) {
      setRejectError(t("approval.detail.rejectDialog.minLength", { min: MIN_COMMENT_LEN }));
      return;
    }
    setRejectError(null);
    setActionLoading(true);
    try {
      await api.reports({ id }).reject.put({
        rejectionTier: rejectTier,
        rejectionCode: rejectCode,
        comment: c,
      });
      setRejectDialogOpen(false);
      setRejectComment("");
      await reloadDetail();
    } catch (e) {
      setRejectError(e instanceof Error ? e.message : t("approval.detail.rejectDialog.error"));
    }
    setActionLoading(false);
  };

  if (!id) {
    router.replace("/panel/approval-list");
    return null;
  }

  if (loading) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center p-4">
        <p className="text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="bg-background flex min-h-screen flex-col items-center justify-center gap-4 p-4">
        <p className="text-destructive text-center">{error || t("approval.detail.notFound")}</p>
        <Button variant="outline" onClick={() => router.push("/panel/approval-list")}>
          {t("approval.detail.backToList")}
        </Button>
      </div>
    );
  }

  const c = report.consensus;
  const userHasReviewed = c?.myReviewAction != null && c.myReviewAction !== "";
  const hasAcceptedReview = c?.myAcceptedAt != null;
  const readOnly = report.status !== "pending" || userHasReviewed;

  const statusBadgeLabel =
    report.status === "accepted"
      ? t("approval.detail.finalAccepted")
      : report.status === "rejected"
        ? t("approval.detail.finalRejected")
        : c != null
          ? t("approval.detail.voteSummary", {
              total: toPersianNum(c.validatorVotesTotal),
              min: toPersianNum(c.minReviews),
              accepted: toPersianNum(c.acceptedVotes),
              goodFaith: toPersianNum(c.goodFaithRejectVotes ?? 0),
              badFaith: toPersianNum(c.badFaithRejectVotes ?? 0),
            })
          : t("approval.detail.waitingVotes");

  const codeOptions = rejectTier === "good_faith" ? GOOD_FAITH_OPTIONS : BAD_FAITH_OPTIONS;
  const selectedCodeHint = codeOptions.find((o) => o.value === rejectCode)?.hint ?? "";

  return (
    <div className="bg-background flex flex-col p-4">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-1 items-start gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/panel/approval-list")}
            className="shrink-0"
          >
            <ArrowRight className="h-5 w-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-foreground mb-2 text-center text-lg font-bold sm:text-right">
              {report.person.firstName} {report.person.lastName}
            </h1>
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <Badge
                variant={
                  report.status === "accepted"
                    ? "default"
                    : report.status === "rejected"
                      ? "destructive"
                      : "secondary"
                }
                className="max-w-full text-right leading-snug whitespace-normal"
              >
                {statusBadgeLabel}
              </Badge>
              {userHasReviewed && report.status === "pending" && (
                <Badge variant="outline" className="border-primary text-primary">
                  {t("approval.detail.reported")}
                </Badge>
              )}
            </div>
          </div>
        </div>
        {!readOnly && !hasAcceptedReview && (
          <div className="border-border bg-muted/30 flex items-center gap-6 rounded-lg border p-1.5 sm:max-w-md">
            <span className="text-muted-foreground text-xs">
              {t("approval.detail.acceptanceHint")}
            </span>
            <Button
              onClick={handleAcceptReview}
              disabled={acceptingReview}
              size="sm"
              className="gap-1.5 bg-blue-600 text-white hover:bg-blue-700"
            >
              <ClipboardCheck className="h-4 w-4" />
              {acceptingReview ? t("approval.detail.accepting") : t("approval.detail.acceptReview")}
            </Button>
          </div>
        )}
        {!readOnly && hasAcceptedReview && (
          <div className="border-border bg-muted/30 flex items-center gap-6 rounded-lg border p-1.5 sm:max-w-md">
            <span className="text-muted-foreground text-xs">{t("approval.detail.voteHint")}</span>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setApproveError(null);
                  setApproveDialogOpen(true);
                }}
                disabled={actionLoading}
                size="sm"
                className="gap-1.5 bg-green-600 text-white hover:bg-green-700"
              >
                <Check className="h-4 w-4" />
                {t("approval.detail.approve")}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  setRejectError(null);
                  setRejectDialogOpen(true);
                }}
                disabled={actionLoading}
                className="gap-1.5"
              >
                <X className="h-4 w-4" />
                {t("approval.detail.reject")}
              </Button>
            </div>
          </div>
        )}
        {readOnly && report.status === "pending" && userHasReviewed && (
          <div className="border-border bg-muted/20 flex flex-col items-center gap-2 rounded-lg border p-1.5 sm:max-w-md">
            <p className="text-muted-foreground flex items-center gap-2 text-center text-xs sm:text-right">
              <CheckCheckIcon className="h-4 w-4" />
              {t("approval.detail.voteRegistered")}
            </p>

            <div className="bg-card flex gap-2 rounded-md border px-2 *:p-1">
              <span className="text-muted-foreground text-xs">{t("approval.detail.yourVote")}</span>
              <strong
                className={`text-xs ${c?.myReviewAction === "accepted" ? "text-green-600" : "text-red-600"}`}
              >
                {c?.myReviewAction === "accepted"
                  ? t("approval.detail.voteAccepted")
                  : t("approval.detail.voteRejected")}
              </strong>
              {c?.myReviewAction === "rejected" && (
                <>
                  <span className="text-muted-foreground text-xs">
                    {t("approval.detail.rejectionCode")}
                  </span>

                  <strong
                    className={`text-xs ${c?.myRejectionTier === "good_faith" ? "text-green-600" : "text-red-600"}`}
                  >
                    {c?.myRejectionTier}
                  </strong>
                </>
              )}
              <span className="text-muted-foreground text-xs">
                {t("approval.detail.rejectionReason")}{" "}
                {c?.myReviewAction === "rejected" ? c?.myRejectionTier : ""}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Reported person */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <User className="h-5 w-5" />
                  {t("approval.detail.reportedPerson")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <InfoRow
                  label={t("approval.detail.name")}
                  value={`${report.person.firstName} ${report.person.lastName}`}
                  icon={User}
                />
                <InfoRow
                  label={t("approval.detail.nationalCode")}
                  value={report.person.nationalCode}
                />
                <InfoRow label={t("approval.detail.titlePosition")} value={report.person.title} />
              </CardContent>
            </Card>

            {/* Submitting user */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <User className="h-5 w-5" />
                  {t("approval.detail.submittingUser")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <InfoRow label={t("approval.detail.name")} value={report.user.name} icon={User} />
                <InfoRow
                  label={t("approval.detail.username")}
                  value={report.user.username}
                  icon={User}
                />
              </CardContent>
            </Card>
          </div>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageSquare className="h-5 w-5" />
                {t("approval.detail.reportDescription")}
              </CardTitle>
              {(report.category || report.subcategory || report.title) && (
                <div className="flex flex-wrap gap-2 text-sm">
                  {report.title && <span className="text-muted-foreground">{report.title}</span>}
                  {report.category && (
                    <span className="text-muted-foreground">• {report.category.name}</span>
                  )}
                  {report.subcategory && (
                    <span className="text-muted-foreground">• {report.subcategory.name}</span>
                  )}
                </div>
              )}
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
                {report.description}
              </p>
            </CardContent>
          </Card>

          {/* Organization and location */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="h-5 w-5" />
                {t("approval.detail.organizationLocation")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <InfoRow
                label={t("approval.detail.orgType")}
                value={report.organizationType}
                icon={Building2}
              />
              <InfoRow label={t("approval.detail.orgName")} value={report.organizationName} />
              <InfoRow
                label={t("approval.detail.province")}
                value={report.province}
                icon={MapPin}
              />
              <InfoRow label={t("approval.detail.city")} value={report.city} icon={MapPin} />
              <InfoRow
                label={t("approval.detail.exactLocation")}
                value={report.exactLocation}
                icon={MapPin}
              />
            </CardContent>
          </Card>

          {/* Time and evidence */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-5 w-5" />
                {t("approval.detail.timeEvidence")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <InfoRow
                label={t("approval.detail.occurrenceDate")}
                value={
                  report.occurrenceDate
                    ? new Date(report.occurrenceDate).toLocaleDateString("fa-IR")
                    : null
                }
                icon={Calendar}
              />
              <InfoRow
                label={t("approval.detail.occurrenceFreq")}
                value={report.occurrenceFrequency}
              />
              {report.hasEvidence != null && (
                <div className="text-sm">
                  <span className="text-muted-foreground">{t("approval.detail.hasEvidence")}</span>
                  <span>{report.hasEvidence ? t("common.yes") : t("common.no")}</span>
                </div>
              )}
              <InfoRow label={t("approval.detail.evidenceType")} value={report.evidenceTypes} />
              <InfoRow
                label={t("approval.detail.evidenceDesc")}
                value={report.evidenceDescription}
              />
            </CardContent>
          </Card>

          {/* Contact */}
          {(report.wantsContact ||
            report.contactEmail ||
            report.contactPhone ||
            report.contactSocial) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Mail className="h-5 w-5" />
                  {t("approval.detail.contact")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <InfoRow
                  label={t("approval.detail.contactEmail")}
                  value={report.contactEmail}
                  icon={Mail}
                />
                <InfoRow label={t("approval.detail.contactPhone")} value={report.contactPhone} />
                <InfoRow label={t("approval.detail.contactSocial")} value={report.contactSocial} />
              </CardContent>
            </Card>
          )}

          {/* Documents */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-5 w-5" />
                {t("approval.detail.documents")} ({report.documents?.length ?? 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!report.documents?.length ? (
                <p className="text-muted-foreground text-sm">{t("approval.detail.noDocuments")}</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {report.documents.map((doc) => (
                    <a
                      key={doc.id}
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:bg-accent inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-colors"
                    >
                      <FileText className="h-4 w-4" />
                      {doc.name}
                    </a>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.push("/panel/approval-list")}
          >
            {t("approval.detail.backToList")}
          </Button>
        </div>

        <Dialog
          open={approveDialogOpen}
          onOpenChange={(open) => {
            setApproveDialogOpen(open);
            if (!open) setApproveError(null);
          }}
        >
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{t("approval.detail.approveDialog.title")}</DialogTitle>
              <DialogDescription className="text-right leading-relaxed">
                {t("approval.detail.approveDialog.description")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {approveError && (
                <p className="text-destructive rounded-md border border-red-200 bg-red-50 p-2 text-sm dark:border-red-900 dark:bg-red-950">
                  {approveError}
                </p>
              )}
              <div className="space-y-2">
                <Label htmlFor="approve-comment">
                  {t("approval.detail.approveDialog.commentLabel")}{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="approve-comment"
                  dir="rtl"
                  placeholder={t("approval.detail.approveDialog.commentPlaceholder")}
                  value={approveComment}
                  onChange={(e) => setApproveComment(e.target.value)}
                  rows={4}
                  className="resize-y text-sm"
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button
                onClick={handleApprove}
                disabled={actionLoading}
                className="gap-1.5 bg-green-600 text-white hover:bg-green-700"
              >
                <Check className="h-4 w-4" />
                {t("approval.detail.approveDialog.submit")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={rejectDialogOpen}
          onOpenChange={(open) => {
            setRejectDialogOpen(open);
            if (!open) setRejectError(null);
          }}
        >
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{t("approval.detail.rejectDialog.title")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {rejectError && (
                <p className="text-destructive rounded-md border border-red-200 bg-red-50 p-2 text-sm dark:border-red-900 dark:bg-red-950">
                  {rejectError}
                </p>
              )}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  {t("approval.detail.rejectDialog.rejectType")}
                </Label>
                <RadioGroup
                  value={rejectTier}
                  onValueChange={(v) => setRejectTier(v as "good_faith" | "bad_faith")}
                  className="flex flex-col gap-2"
                >
                  <label className="flex cursor-pointer items-start gap-2 rounded-md border p-3 text-sm">
                    <RadioGroupItem value="good_faith" id="tier-g" className="mt-0.5" />
                    <span>
                      <span className="font-medium" id="tier-g-label">
                        {t("approval.detail.rejectDialog.goodFaith")}
                      </span>
                      <span className="text-muted-foreground block text-xs">
                        {t("approval.detail.rejectDialog.goodFaithHint")}
                      </span>
                    </span>
                  </label>
                  <label className="flex cursor-pointer items-start gap-2 rounded-md border p-3 text-sm">
                    <RadioGroupItem value="bad_faith" id="tier-b" className="mt-0.5" />
                    <span>
                      <span className="font-medium">
                        {t("approval.detail.rejectDialog.badFaith")}
                      </span>
                      <span className="text-muted-foreground block text-xs">
                        {t("approval.detail.rejectDialog.badFaithHint")}
                      </span>
                    </span>
                  </label>
                </RadioGroup>
              </div>
              <div className="space-y-2">
                <Label>{t("approval.detail.rejectDialog.rejectCode")}</Label>
                <Select value={rejectCode} onValueChange={setRejectCode}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {codeOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedCodeHint ? (
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    {selectedCodeHint}
                  </p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="reject-comment">
                  {t("approval.detail.rejectDialog.commentLabel")}{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="reject-comment"
                  dir="rtl"
                  placeholder={t("approval.detail.rejectDialog.commentPlaceholder")}
                  value={rejectComment}
                  onChange={(e) => setRejectComment(e.target.value)}
                  rows={4}
                  className="resize-y text-sm"
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button variant="destructive" onClick={handleReject} disabled={actionLoading}>
                {t("approval.detail.rejectDialog.submit")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
