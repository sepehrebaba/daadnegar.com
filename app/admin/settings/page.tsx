"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/edyen";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

type SettingsData = {
  reports_enabled: boolean;
  default_tokens_new_user: number;
  tokens_report_submit_stake: number;
  tokens_reward_approved_report: number;
  tokens_deduct_false_report: number;
  tokens_deduct_problematic_report: number;
  tokens_reward_invited_activity: number;
  tokens_invite_create_stake: number;
  max_invite_codes_unused: number;
  min_approved_reports_for_approval: number;
  report_validator_sla_hours: number;
  report_unassigned_grace_minutes: number;
  report_parallel_validators: number;
  report_consensus_min_reviews: number;
  tokens_consensus_reporter_accept: number;
  tokens_consensus_reporter_reject_penalty: number;
  tokens_consensus_validator_correct: number;
  tokens_consensus_validator_wrong_penalty: number;
  tokens_consensus_validator_refund: number;
  tokens_consensus_validator_bonus_match_3: number;
  tokens_consensus_validator_bonus_match_5: number;
};

const LABELS: Record<keyof SettingsData, string> = {
  reports_enabled: "فعال‌سازی دریافت گزارش جدید",
  default_tokens_new_user: "تعداد توکن‌های پیش‌فرض کاربر جدید",
  tokens_report_submit_stake: "مقدار توکن وثیقه در زمان ثبت گزارش",
  tokens_reward_approved_report: "تعداد توکن هدیه بعد از تأیید گزارش",
  tokens_deduct_false_report: "تعداد توکن کسر شده در صورت گزارش غلط",
  tokens_deduct_problematic_report: "تعداد توکن کسر شده در صورت گزارش مشکل‌دار",
  tokens_reward_invited_activity: "تعداد توکن هدیه در صورت فعالیت کاربر دعوت‌شده",
  tokens_invite_create_stake: "مقدار توکن وثیقه هنگام ساخت کد دعوت",
  max_invite_codes_unused: "حداکثر کد دعوت مجاز (استفاده‌نشده)",
  min_approved_reports_for_approval: "حداقل تعداد گزارش تاییدشده برای مجوز تایید گزارش‌های دیگران",
  report_validator_sla_hours:
    "مهلت بررسی اعتبارسنج (ساعت) — پس از آن Cron می‌تواند گزارش را به نفر بعد بدهد",
  report_unassigned_grace_minutes:
    "تاخیر اختصاص خودکار (دقیقه) اگر ورکر هنوز گزارش را به کسی نداده باشد",
  report_parallel_validators: "تعداد اعتبارسنج‌هایی که همزمان یک گزارش جدید به آن‌ها اساین می‌شود",
  report_consensus_min_reviews:
    "حداقل تعداد رأی اعتبارسنج (ثبت‌شده در اپ) قبل از تعیین وضعیت نهایی بر اساس اکثریت",
  tokens_consensus_reporter_accept:
    "پاداش گزارش‌دهنده وقتی اکثریت گزارش را تأیید کردند (تسویه از طریق صف)",
  tokens_consensus_reporter_reject_penalty:
    "مقدار کسر از گزارش‌دهنده وقتی اکثریت رد کردند (عدد مثبت؛ به‌صورت منفی اعمال می‌شود)",
  tokens_consensus_validator_correct:
    "پاداش قدیمی (اکثریت) — در منطق جدید از refund + bonus استفاده می‌شود",
  tokens_consensus_validator_wrong_penalty:
    "جریمه رأی سوءنیت وقتی نتیجه نهایی «تأیید» است (عدد مثبت)",
  tokens_consensus_validator_refund: "بازپرداخت اسمی به هر اعتبارسنج پس از تسویه اجماع",
  tokens_consensus_validator_bonus_match_3:
    "پاداش اضافه وقتی رأی با نتیجه نهایی یکی است (۳ اعتبارسنج؛ می‌تواند اعشاری مثل ۱.۵ باشد)",
  tokens_consensus_validator_bonus_match_5: "پاداش اضافه وقتی رأی با اکثریت یکی است (۵ اعتبارسنج)",
};

const defaults: SettingsData = {
  reports_enabled: true,
  default_tokens_new_user: 10,
  tokens_report_submit_stake: 5,
  tokens_reward_approved_report: 5,
  tokens_deduct_false_report: 3,
  tokens_deduct_problematic_report: 1,
  tokens_reward_invited_activity: 2,
  tokens_invite_create_stake: 3,
  max_invite_codes_unused: 5,
  min_approved_reports_for_approval: 5,
  report_validator_sla_hours: 48,
  report_unassigned_grace_minutes: 5,
  report_parallel_validators: 3,
  report_consensus_min_reviews: 3,
  tokens_consensus_reporter_accept: 5,
  tokens_consensus_reporter_reject_penalty: 3,
  tokens_consensus_validator_correct: 2,
  tokens_consensus_validator_wrong_penalty: 2,
  tokens_consensus_validator_refund: 2,
  tokens_consensus_validator_bonus_match_3: 1.5,
  tokens_consensus_validator_bonus_match_5: 2,
};

export default function AdminSystemSettingsPage() {
  const [settings, setSettings] = useState<SettingsData>(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = async () => {
    const { data } = await api.admin.settings.get();
    const raw = data?.data ?? {};
    setSettings({
      reports_enabled:
        typeof raw.reports_enabled === "boolean"
          ? raw.reports_enabled
          : raw.reports_enabled === "true",
      default_tokens_new_user:
        Number(raw.default_tokens_new_user) || defaults.default_tokens_new_user,
      tokens_report_submit_stake: Number.isFinite(Number(raw.tokens_report_submit_stake))
        ? Number(raw.tokens_report_submit_stake)
        : defaults.tokens_report_submit_stake,
      tokens_reward_approved_report:
        Number(raw.tokens_reward_approved_report) || defaults.tokens_reward_approved_report,
      tokens_deduct_false_report:
        Number(raw.tokens_deduct_false_report) || defaults.tokens_deduct_false_report,
      tokens_deduct_problematic_report:
        Number(raw.tokens_deduct_problematic_report) || defaults.tokens_deduct_problematic_report,
      tokens_reward_invited_activity:
        Number(raw.tokens_reward_invited_activity) || defaults.tokens_reward_invited_activity,
      tokens_invite_create_stake: Number.isFinite(Number(raw.tokens_invite_create_stake))
        ? Number(raw.tokens_invite_create_stake)
        : defaults.tokens_invite_create_stake,
      max_invite_codes_unused:
        Number(raw.max_invite_codes_unused) ?? defaults.max_invite_codes_unused,
      min_approved_reports_for_approval:
        Number(raw.min_approved_reports_for_approval) ?? defaults.min_approved_reports_for_approval,
      report_validator_sla_hours:
        Number(raw.report_validator_sla_hours) || defaults.report_validator_sla_hours,
      report_unassigned_grace_minutes:
        Number(raw.report_unassigned_grace_minutes) || defaults.report_unassigned_grace_minutes,
      report_parallel_validators:
        Number(raw.report_parallel_validators) || defaults.report_parallel_validators,
      report_consensus_min_reviews:
        Number(raw.report_consensus_min_reviews) || defaults.report_consensus_min_reviews,
      tokens_consensus_reporter_accept:
        Number(raw.tokens_consensus_reporter_accept) || defaults.tokens_consensus_reporter_accept,
      tokens_consensus_reporter_reject_penalty:
        Number(raw.tokens_consensus_reporter_reject_penalty) ||
        defaults.tokens_consensus_reporter_reject_penalty,
      tokens_consensus_validator_correct:
        Number(raw.tokens_consensus_validator_correct) ||
        defaults.tokens_consensus_validator_correct,
      tokens_consensus_validator_wrong_penalty:
        Number(raw.tokens_consensus_validator_wrong_penalty) ||
        defaults.tokens_consensus_validator_wrong_penalty,
      tokens_consensus_validator_refund:
        Number(raw.tokens_consensus_validator_refund) || defaults.tokens_consensus_validator_refund,
      tokens_consensus_validator_bonus_match_3:
        Number(raw.tokens_consensus_validator_bonus_match_3) ||
        defaults.tokens_consensus_validator_bonus_match_3,
      tokens_consensus_validator_bonus_match_5:
        Number(raw.tokens_consensus_validator_bonus_match_5) ||
        defaults.tokens_consensus_validator_bonus_match_5,
    });
  };

  useEffect(() => {
    fetchSettings().finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.admin.settings.put({
        reports_enabled: settings.reports_enabled,
        default_tokens_new_user: settings.default_tokens_new_user,
        tokens_report_submit_stake: settings.tokens_report_submit_stake,
        tokens_reward_approved_report: settings.tokens_reward_approved_report,
        tokens_deduct_false_report: settings.tokens_deduct_false_report,
        tokens_deduct_problematic_report: settings.tokens_deduct_problematic_report,
        tokens_reward_invited_activity: settings.tokens_reward_invited_activity,
        tokens_invite_create_stake: settings.tokens_invite_create_stake,
        max_invite_codes_unused: settings.max_invite_codes_unused,
        min_approved_reports_for_approval: settings.min_approved_reports_for_approval,
        report_validator_sla_hours: settings.report_validator_sla_hours,
        report_unassigned_grace_minutes: settings.report_unassigned_grace_minutes,
        report_parallel_validators: settings.report_parallel_validators,
        report_consensus_min_reviews: settings.report_consensus_min_reviews,
        tokens_consensus_reporter_accept: settings.tokens_consensus_reporter_accept,
        tokens_consensus_reporter_reject_penalty: settings.tokens_consensus_reporter_reject_penalty,
        tokens_consensus_validator_correct: settings.tokens_consensus_validator_correct,
        tokens_consensus_validator_wrong_penalty: settings.tokens_consensus_validator_wrong_penalty,
        tokens_consensus_validator_refund: settings.tokens_consensus_validator_refund,
        tokens_consensus_validator_bonus_match_3: settings.tokens_consensus_validator_bonus_match_3,
        tokens_consensus_validator_bonus_match_5: settings.tokens_consensus_validator_bonus_match_5,
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6" dir="rtl">
        <p>در حال بارگذاری...</p>
      </div>
    );
  }

  return (
    <div dir="rtl" className="text-right">
      <h1 className="mb-6 text-2xl font-bold">تنظیمات سیستم</h1>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>تنظیمات توکن و گزارش</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="flex flex-row items-center justify-between rounded-lg border p-4 md:col-span-2">
                <Label htmlFor="reports_enabled" className="cursor-pointer">
                  {LABELS.reports_enabled}
                </Label>
                <Switch
                  id="reports_enabled"
                  checked={settings.reports_enabled}
                  onCheckedChange={(v) => setSettings((s) => ({ ...s, reports_enabled: v }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="default_tokens_new_user">{LABELS.default_tokens_new_user}</Label>
                <Input
                  id="default_tokens_new_user"
                  type="number"
                  min={0}
                  value={settings.default_tokens_new_user}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      default_tokens_new_user: Math.max(
                        0,
                        Number.parseInt(e.target.value, 10) || 0,
                      ),
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tokens_report_submit_stake">
                  {LABELS.tokens_report_submit_stake}
                </Label>
                <Input
                  id="tokens_report_submit_stake"
                  type="number"
                  min={0}
                  value={settings.tokens_report_submit_stake}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      tokens_report_submit_stake: Math.max(
                        0,
                        Number.parseInt(e.target.value, 10) || 0,
                      ),
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tokens_reward_approved_report">
                  {LABELS.tokens_reward_approved_report}
                </Label>
                <Input
                  id="tokens_reward_approved_report"
                  type="number"
                  min={0}
                  value={settings.tokens_reward_approved_report}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      tokens_reward_approved_report: Math.max(
                        0,
                        Number.parseInt(e.target.value, 10) || 0,
                      ),
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tokens_deduct_false_report">
                  {LABELS.tokens_deduct_false_report}
                </Label>
                <Input
                  id="tokens_deduct_false_report"
                  type="number"
                  min={0}
                  value={settings.tokens_deduct_false_report}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      tokens_deduct_false_report: Math.max(
                        0,
                        Number.parseInt(e.target.value, 10) || 0,
                      ),
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tokens_deduct_problematic_report">
                  {LABELS.tokens_deduct_problematic_report}
                </Label>
                <Input
                  id="tokens_deduct_problematic_report"
                  type="number"
                  min={0}
                  value={settings.tokens_deduct_problematic_report}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      tokens_deduct_problematic_report: Math.max(
                        0,
                        Number.parseInt(e.target.value, 10) || 0,
                      ),
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tokens_reward_invited_activity">
                  {LABELS.tokens_reward_invited_activity}
                </Label>
                <Input
                  id="tokens_reward_invited_activity"
                  type="number"
                  min={0}
                  value={settings.tokens_reward_invited_activity}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      tokens_reward_invited_activity: Math.max(
                        0,
                        Number.parseInt(e.target.value, 10) || 0,
                      ),
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_invite_codes_unused">{LABELS.max_invite_codes_unused}</Label>
                <Input
                  id="max_invite_codes_unused"
                  type="number"
                  min={0}
                  value={settings.max_invite_codes_unused}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      max_invite_codes_unused: Math.max(
                        0,
                        Number.parseInt(e.target.value, 10) || 0,
                      ),
                    }))
                  }
                />
                <p className="text-muted-foreground text-xs">
                  ۰ = نامحدود. کاربر نمی‌تواند بیش از این تعداد کد دعوت استفاده‌نشده داشته باشد.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tokens_invite_create_stake">
                  {LABELS.tokens_invite_create_stake}
                </Label>
                <Input
                  id="tokens_invite_create_stake"
                  type="number"
                  min={0}
                  value={settings.tokens_invite_create_stake}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      tokens_invite_create_stake: Math.max(
                        0,
                        Number.parseInt(e.target.value, 10) || 0,
                      ),
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="min_approved_reports_for_approval">
                  {LABELS.min_approved_reports_for_approval}
                </Label>
                <Input
                  id="min_approved_reports_for_approval"
                  type="number"
                  min={0}
                  value={settings.min_approved_reports_for_approval}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      min_approved_reports_for_approval: Math.max(
                        0,
                        Number.parseInt(e.target.value, 10) || 0,
                      ),
                    }))
                  }
                />
                <p className="text-muted-foreground text-xs">
                  کاربران با نقش اعتبارسنج یا با حداقل این تعداد گزارش تاییدشده می‌توانند گزارش‌های
                  دیگران را تایید کنند.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="report_validator_sla_hours">
                  {LABELS.report_validator_sla_hours}
                </Label>
                <Input
                  id="report_validator_sla_hours"
                  type="number"
                  min={1}
                  value={settings.report_validator_sla_hours}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      report_validator_sla_hours: Math.max(
                        1,
                        Number.parseInt(e.target.value, 10) || 1,
                      ),
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="report_unassigned_grace_minutes">
                  {LABELS.report_unassigned_grace_minutes}
                </Label>
                <Input
                  id="report_unassigned_grace_minutes"
                  type="number"
                  min={1}
                  value={settings.report_unassigned_grace_minutes}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      report_unassigned_grace_minutes: Math.max(
                        1,
                        Number.parseInt(e.target.value, 10) || 1,
                      ),
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="report_parallel_validators">
                  {LABELS.report_parallel_validators}
                </Label>
                <Input
                  id="report_parallel_validators"
                  type="number"
                  min={1}
                  max={50}
                  value={settings.report_parallel_validators}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      report_parallel_validators: Math.min(
                        50,
                        Math.max(1, Number.parseInt(e.target.value, 10) || 1),
                      ),
                    }))
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>اکثریت رأی و تسویه توکن (صف RabbitMQ)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
              پس از رسیدن به حد نصاب، نتیجه از روی سه سطح رأی محاسبه می‌شود: تأیید، رد با حسن‌نیت، رد
              با سوءنیت (قوانین ۳ نفره در کد). تسویه توکن گزارش‌دهنده از تنظیمات کسر «مسئله‌دار / غلط»
              و برای اعتبارسنج‌ها از بازپرداخت + پاداش هم‌رأیی (و جریمه رأی سوءنیت در برابر تأیید
              نهایی) استفاده می‌کند.
            </p>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="report_consensus_min_reviews">
                  {LABELS.report_consensus_min_reviews}
                </Label>
                <Input
                  id="report_consensus_min_reviews"
                  type="number"
                  min={1}
                  max={50}
                  value={settings.report_consensus_min_reviews}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      report_consensus_min_reviews: Math.min(
                        50,
                        Math.max(1, Number.parseInt(e.target.value, 10) || 1),
                      ),
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tokens_consensus_reporter_accept">
                  {LABELS.tokens_consensus_reporter_accept}
                </Label>
                <Input
                  id="tokens_consensus_reporter_accept"
                  type="number"
                  min={0}
                  value={settings.tokens_consensus_reporter_accept}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      tokens_consensus_reporter_accept: Math.max(
                        0,
                        Number.parseInt(e.target.value, 10) || 0,
                      ),
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tokens_consensus_reporter_reject_penalty">
                  {LABELS.tokens_consensus_reporter_reject_penalty}
                </Label>
                <Input
                  id="tokens_consensus_reporter_reject_penalty"
                  type="number"
                  min={0}
                  value={settings.tokens_consensus_reporter_reject_penalty}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      tokens_consensus_reporter_reject_penalty: Math.max(
                        0,
                        Number.parseInt(e.target.value, 10) || 0,
                      ),
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tokens_consensus_validator_refund">
                  {LABELS.tokens_consensus_validator_refund}
                </Label>
                <Input
                  id="tokens_consensus_validator_refund"
                  type="number"
                  min={0}
                  step={0.5}
                  value={settings.tokens_consensus_validator_refund}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      tokens_consensus_validator_refund: Math.max(
                        0,
                        Number.parseFloat(e.target.value) || 0,
                      ),
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tokens_consensus_validator_bonus_match_3">
                  {LABELS.tokens_consensus_validator_bonus_match_3}
                </Label>
                <Input
                  id="tokens_consensus_validator_bonus_match_3"
                  type="number"
                  min={0}
                  step={0.5}
                  value={settings.tokens_consensus_validator_bonus_match_3}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      tokens_consensus_validator_bonus_match_3: Math.max(
                        0,
                        Number.parseFloat(e.target.value) || 0,
                      ),
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tokens_consensus_validator_bonus_match_5">
                  {LABELS.tokens_consensus_validator_bonus_match_5}
                </Label>
                <Input
                  id="tokens_consensus_validator_bonus_match_5"
                  type="number"
                  min={0}
                  step={0.5}
                  value={settings.tokens_consensus_validator_bonus_match_5}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      tokens_consensus_validator_bonus_match_5: Math.max(
                        0,
                        Number.parseFloat(e.target.value) || 0,
                      ),
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tokens_consensus_validator_wrong_penalty">
                  {LABELS.tokens_consensus_validator_wrong_penalty}
                </Label>
                <Input
                  id="tokens_consensus_validator_wrong_penalty"
                  type="number"
                  min={0}
                  step={0.5}
                  value={settings.tokens_consensus_validator_wrong_penalty}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      tokens_consensus_validator_wrong_penalty: Math.max(
                        0,
                        Number.parseFloat(e.target.value) || 0,
                      ),
                    }))
                  }
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="tokens_consensus_validator_correct">
                  {LABELS.tokens_consensus_validator_correct}
                </Label>
                <Input
                  id="tokens_consensus_validator_correct"
                  type="number"
                  min={0}
                  step={0.5}
                  value={settings.tokens_consensus_validator_correct}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      tokens_consensus_validator_correct: Math.max(
                        0,
                        Number.parseFloat(e.target.value) || 0,
                      ),
                    }))
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6">
          <Button type="submit" disabled={saving}>
            {saving ? "در حال ذخیره..." : "ذخیره تنظیمات"}
          </Button>
        </div>
      </form>
    </div>
  );
}
