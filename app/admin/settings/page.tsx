"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/edyen";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
  report_validator_sla_hours: number;
  report_unassigned_grace_minutes: number;
  report_parallel_validators: number;
  report_consensus_min_reviews: number;
  tokens_consensus_reporter_accept: number;
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
  report_validator_sla_hours: "مهلت بررسی اعتبارسنج (ساعت)",
  report_unassigned_grace_minutes:
    "تاخیر اختصاص خودکار (دقیقه) اگر ورکر هنوز گزارش را به کسی نداده باشد",
  report_parallel_validators: "تعداد اعتبارسنج همزمان",
  report_consensus_min_reviews: "حداقل رأی برای اجماع",
  tokens_consensus_reporter_accept:
    "پاداش گزارش‌دهنده وقتی اکثریت گزارش را تأیید کردند (تسویه از طریق صف)",
  tokens_consensus_validator_wrong_penalty: "جریمه رأی اشتباه اعتبارسنج",
  tokens_consensus_validator_refund: "بازپرداخت پایه اعتبارسنج",
  tokens_consensus_validator_bonus_match_3: "پاداش تطابق رأی (۳ نفره)",
  tokens_consensus_validator_bonus_match_5: "پاداش تطابق رأی (۵ نفره)",
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
  report_validator_sla_hours: 48,
  report_unassigned_grace_minutes: 5,
  report_parallel_validators: 3,
  report_consensus_min_reviews: 3,
  tokens_consensus_reporter_accept: 5,
  tokens_consensus_validator_wrong_penalty: 2,
  tokens_consensus_validator_refund: 2,
  tokens_consensus_validator_bonus_match_3: 1.5,
  tokens_consensus_validator_bonus_match_5: 2,
};

type NumericSettingKey = Exclude<keyof SettingsData, "reports_enabled">;

const NUMERIC_FIELDS: Array<{
  key: NumericSettingKey;
  min: number;
  max?: number;
  step?: number;
  parse: "int" | "float";
  hint?: string;
}> = [
  { key: "default_tokens_new_user", min: 0, parse: "int" },
  {
    key: "tokens_report_submit_stake",
    min: 0,
    parse: "int",
    hint: "توکن وثیقه",
  },
  { key: "tokens_reward_approved_report", min: 0, parse: "int" },
  { key: "tokens_deduct_false_report", min: 0, parse: "int" },
  { key: "tokens_deduct_problematic_report", min: 0, parse: "int" },
  { key: "tokens_reward_invited_activity", min: 0, parse: "int" },
  { key: "tokens_invite_create_stake", min: 0, parse: "int" },
  { key: "max_invite_codes_unused", min: 0, parse: "int", hint: "۰ = نامحدود" },
  {
    key: "report_validator_sla_hours",
    min: 1,
    parse: "int",
    hint: "پس از این زمان، Cron می‌تواند گزارش را به نفر بعد بدهد.",
  },
  { key: "report_unassigned_grace_minutes", min: 1, parse: "int" },
  {
    key: "report_parallel_validators",
    min: 1,
    max: 50,
    parse: "int",
    hint: "هر گزارش جدید به این تعداد اعتبارسنج به‌صورت همزمان اساین می‌شود.",
  },
  {
    key: "report_consensus_min_reviews",
    min: 1,
    max: 50,
    parse: "int",
    hint: "حداقل رأی ثبت‌شده قبل از تعیین وضعیت نهایی با اکثریت.",
  },
  { key: "tokens_consensus_reporter_accept", min: 0, parse: "int" },
  {
    key: "tokens_consensus_validator_refund",
    min: 0,
    step: 0.5,
    parse: "float",
    hint: "بازپرداخت اسمی به هر اعتبارسنج پس از تسویه اجماع.",
  },
  {
    key: "tokens_consensus_validator_bonus_match_3",
    min: 0,
    step: 0.5,
    parse: "float",
    hint: "وقتی رأی با نتیجه نهایی یکی باشد (برای سناریوی ۳ اعتبارسنج).",
  },
  {
    key: "tokens_consensus_validator_bonus_match_5",
    min: 0,
    step: 0.5,
    parse: "float",
    hint: "وقتی رأی با اکثریت یکی باشد (برای سناریوی ۵ اعتبارسنج).",
  },
  {
    key: "tokens_consensus_validator_wrong_penalty",
    min: 0,
    step: 0.5,
    parse: "float",
    hint: "جریمه رأی اشتباه وقتی نتیجه نهایی «تأیید» باشد (عدد مثبت).",
  },
];

const NUMERIC_FIELD_MAP: Record<NumericSettingKey, (typeof NUMERIC_FIELDS)[number]> =
  Object.fromEntries(NUMERIC_FIELDS.map((field) => [field.key, field])) as Record<
    NumericSettingKey,
    (typeof NUMERIC_FIELDS)[number]
  >;

const SETTING_SECTIONS: Array<{
  id: string;
  title: string;
  keys: NumericSettingKey[];
  includeReportsToggle?: boolean;
}> = [
  {
    id: "system",
    title: "بخش سیستم",
    includeReportsToggle: true,
    keys: ["report_unassigned_grace_minutes"],
  },
  {
    id: "validator",
    title: "بخش اعتبارسنج",
    keys: [
      "report_validator_sla_hours",
      "report_parallel_validators",
      "report_consensus_min_reviews",
      "tokens_consensus_validator_wrong_penalty",
      "tokens_consensus_validator_refund",
      "tokens_consensus_validator_bonus_match_3",
      "tokens_consensus_validator_bonus_match_5",
    ],
  },
  {
    id: "user",
    title: "بخش کاربر",
    keys: [
      "default_tokens_new_user",
      "tokens_report_submit_stake",
      "tokens_reward_approved_report",
      "tokens_deduct_false_report",
      "tokens_deduct_problematic_report",
      "tokens_reward_invited_activity",
      "tokens_invite_create_stake",
      "max_invite_codes_unused",
      "tokens_consensus_reporter_accept",
    ],
  },
];

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
      max_invite_codes_unused: Number.isFinite(Number(raw.max_invite_codes_unused))
        ? Number(raw.max_invite_codes_unused)
        : defaults.max_invite_codes_unused,
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
        report_validator_sla_hours: settings.report_validator_sla_hours,
        report_unassigned_grace_minutes: settings.report_unassigned_grace_minutes,
        report_parallel_validators: settings.report_parallel_validators,
        report_consensus_min_reviews: settings.report_consensus_min_reviews,
        tokens_consensus_reporter_accept: settings.tokens_consensus_reporter_accept,
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
        {SETTING_SECTIONS.map((section) => (
          <Card key={section.id} className="mb-6">
            <CardHeader>
              <CardTitle>{section.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[45%]">تنظیم</TableHead>
                      <TableHead className="w-[20%]">مقدار</TableHead>
                      <TableHead className="w-[35%]">راهنما</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {section.includeReportsToggle ? (
                      <TableRow>
                        <TableCell className="font-medium">{LABELS.reports_enabled}</TableCell>
                        <TableCell>
                          <Switch
                            id="reports_enabled"
                            checked={settings.reports_enabled}
                            onCheckedChange={(v) =>
                              setSettings((s) => ({ ...s, reports_enabled: v }))
                            }
                          />
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          خاموش بودن این گزینه ثبت گزارش جدید را در API و پنل کاربر غیرفعال می‌کند.
                        </TableCell>
                      </TableRow>
                    ) : null}
                    {section.keys.map((key) => {
                      const field = NUMERIC_FIELD_MAP[key];
                      return (
                        <TableRow key={field.key}>
                          <TableCell className="font-medium">{LABELS[field.key]}</TableCell>
                          <TableCell>
                            <Input
                              id={field.key}
                              type="number"
                              min={field.min}
                              max={field.max}
                              step={field.step}
                              value={settings[field.key]}
                              onChange={(e) => {
                                const parsed =
                                  field.parse === "float"
                                    ? Number.parseFloat(e.target.value)
                                    : Number.parseInt(e.target.value, 10);
                                let next = Number.isFinite(parsed) ? parsed : field.min;
                                if (field.max != null) next = Math.min(field.max, next);
                                next = Math.max(field.min, next);
                                setSettings((s) => ({ ...s, [field.key]: next }));
                              }}
                              className="h-9"
                            />
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs">
                            {field.hint ?? "—"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ))}

        <div className="mt-6">
          <Button type="submit" disabled={saving}>
            {saving ? "در حال ذخیره..." : "ذخیره تنظیمات"}
          </Button>
        </div>
      </form>
    </div>
  );
}
