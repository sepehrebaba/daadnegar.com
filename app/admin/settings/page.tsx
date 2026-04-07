"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
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
  hintKey?: string;
}> = [
  { key: "default_tokens_new_user", min: 0, parse: "int" },
  {
    key: "tokens_report_submit_stake",
    min: 0,
    parse: "int",
    hintKey: "tokens_report_submit_stake",
  },
  { key: "tokens_reward_approved_report", min: 0, parse: "int" },
  { key: "tokens_deduct_false_report", min: 0, parse: "int" },
  { key: "tokens_deduct_problematic_report", min: 0, parse: "int" },
  { key: "tokens_reward_invited_activity", min: 0, parse: "int" },
  { key: "tokens_invite_create_stake", min: 0, parse: "int" },
  { key: "max_invite_codes_unused", min: 0, parse: "int", hintKey: "max_invite_codes_unused" },
  {
    key: "report_validator_sla_hours",
    min: 1,
    parse: "int",
    hintKey: "report_validator_sla_hours",
  },
  { key: "report_unassigned_grace_minutes", min: 1, parse: "int" },
  {
    key: "report_parallel_validators",
    min: 1,
    max: 50,
    parse: "int",
    hintKey: "report_parallel_validators",
  },
  {
    key: "report_consensus_min_reviews",
    min: 1,
    max: 50,
    parse: "int",
    hintKey: "report_consensus_min_reviews",
  },
  { key: "tokens_consensus_reporter_accept", min: 0, parse: "int" },
  {
    key: "tokens_consensus_validator_refund",
    min: 0,
    step: 0.5,
    parse: "float",
    hintKey: "tokens_consensus_validator_refund",
  },
  {
    key: "tokens_consensus_validator_bonus_match_3",
    min: 0,
    step: 0.5,
    parse: "float",
    hintKey: "tokens_consensus_validator_bonus_match_3",
  },
  {
    key: "tokens_consensus_validator_bonus_match_5",
    min: 0,
    step: 0.5,
    parse: "float",
    hintKey: "tokens_consensus_validator_bonus_match_5",
  },
  {
    key: "tokens_consensus_validator_wrong_penalty",
    min: 0,
    step: 0.5,
    parse: "float",
    hintKey: "tokens_consensus_validator_wrong_penalty",
  },
];

const NUMERIC_FIELD_MAP: Record<NumericSettingKey, (typeof NUMERIC_FIELDS)[number]> =
  Object.fromEntries(NUMERIC_FIELDS.map((field) => [field.key, field])) as Record<
    NumericSettingKey,
    (typeof NUMERIC_FIELDS)[number]
  >;

const SETTING_SECTION_KEYS: Array<{
  id: string;
  sectionKey: string;
  keys: NumericSettingKey[];
  includeReportsToggle?: boolean;
}> = [
  {
    id: "system",
    sectionKey: "system",
    includeReportsToggle: true,
    keys: ["report_unassigned_grace_minutes"],
  },
  {
    id: "validator",
    sectionKey: "validator",
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
    sectionKey: "user",
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
  const { t } = useTranslation();
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
        <p>{t("common.loading")}</p>
      </div>
    );
  }

  return (
    <div dir="rtl" className="text-right">
      <h1 className="mb-6 text-2xl font-bold">{t("adminSystemSettings.title")}</h1>

      <form onSubmit={handleSubmit}>
        {SETTING_SECTION_KEYS.map((section) => (
          <Card key={section.id} className="mb-6">
            <CardHeader>
              <CardTitle>{t(`adminSystemSettings.sections.${section.sectionKey}`)}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[45%]">{t("adminSystemSettings.setting")}</TableHead>
                      <TableHead className="w-[20%]">{t("adminSystemSettings.value")}</TableHead>
                      <TableHead className="w-[35%]">{t("adminSystemSettings.guide")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {section.includeReportsToggle ? (
                      <TableRow>
                        <TableCell className="font-medium">
                          {t("adminSystemSettings.labels.reports_enabled")}
                        </TableCell>
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
                          {t("adminSystemSettings.reportsEnabledHint")}
                        </TableCell>
                      </TableRow>
                    ) : null}
                    {section.keys.map((key) => {
                      const field = NUMERIC_FIELD_MAP[key];
                      return (
                        <TableRow key={field.key}>
                          <TableCell className="font-medium">
                            {t(`adminSystemSettings.labels.${field.key}`)}
                          </TableCell>
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
                            {field.hintKey ? t(`adminSystemSettings.hints.${field.hintKey}`) : "—"}
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
            {saving ? t("common.saving") : t("adminSystemSettings.saveSettings")}
          </Button>
        </div>
      </form>
    </div>
  );
}
