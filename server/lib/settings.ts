import { prisma } from "../db";

/** Setting keys and their default values */
export const SETTING_KEYS = {
  /** Enable/disable new report submission */
  REPORTS_ENABLED: "reports_enabled",
  /** Default token balance for new invite users */
  DEFAULT_TOKENS_NEW_USER: "default_tokens_new_user",
  /** Tokens rewarded when report is approved */
  TOKENS_REWARD_APPROVED_REPORT: "tokens_reward_approved_report",
  /** Tokens deducted when report is rejected as false */
  TOKENS_DEDUCT_FALSE_REPORT: "tokens_deduct_false_report",
  /** Tokens deducted when report is rejected as problematic */
  TOKENS_DEDUCT_PROBLEMATIC_REPORT: "tokens_deduct_problematic_report",
  /** Tokens rewarded when invited user submits first report (activity) */
  TOKENS_REWARD_INVITED_ACTIVITY: "tokens_reward_invited_activity",
  /** Max unused invite codes per user */
  MAX_INVITE_CODES_UNUSED: "max_invite_codes_unused",
  /** Min approved reports required for user to see approval section (approve others) */
  MIN_APPROVED_REPORTS_FOR_APPROVAL: "min_approved_reports_for_approval",
  /** Hours after assignment before Cron/worker may reassign to another validator */
  REPORT_VALIDATOR_SLA_HOURS: "report_validator_sla_hours",
  /** Minutes to wait before assigning pending reports that never got a worker assignment */
  REPORT_UNASSIGNED_GRACE_MINUTES: "report_unassigned_grace_minutes",
  /** How many validators receive the same pending report at once (capped by validator count) */
  REPORT_PARALLEL_VALIDATORS: "report_parallel_validators",
  /** حداقل تعداد رأی اعتبارسنج (با reviewerId) قبل از تعیین وضعیت نهایی گزارش */
  REPORT_CONSENSUS_MIN_REVIEWS: "report_consensus_min_reviews",
  /** پاداش گزارش‌دهنده اگر اکثریت تأیید کرد */
  TOKENS_CONSENSUS_REPORTER_ACCEPT: "tokens_consensus_reporter_accept",
  /** مقدار کسر از گزارش‌دهنده اگر اکثریت رد کرد (عدد مثبت؛ در تراکنش منفی اعمال می‌شود) */
  TOKENS_CONSENSUS_REPORTER_REJECT_PENALTY: "tokens_consensus_reporter_reject_penalty",
  /** پاداش هر اعتبارسنجی که رأی‌اش با نتیجه نهایی یکی بود (قدیمی؛ ترجیح با refund+bonus) */
  TOKENS_CONSENSUS_VALIDATOR_CORRECT: "tokens_consensus_validator_correct",
  /** مقدار کسر از اعتبارسنج اگر رأی‌اش با نتیجه نهایی ناهم‌خوان بود (عدد مثبت) */
  TOKENS_CONSENSUS_VALIDATOR_WRONG_PENALTY: "tokens_consensus_validator_wrong_penalty",
  /** بازپرداخت اسمی به هر اعتبارسنج پس از تسویه اجماع */
  TOKENS_CONSENSUS_VALIDATOR_REFUND: "tokens_consensus_validator_refund",
  /** پاداش اضافه وقتی رأی با نتیجه یکی است (۳ اعتبارسنج) */
  TOKENS_CONSENSUS_VALIDATOR_BONUS_MATCH_3: "tokens_consensus_validator_bonus_match_3",
  /** پاداش اضافه وقتی رأی با اکثریت یکی است (۵ اعتبارسنج) */
  TOKENS_CONSENSUS_VALIDATOR_BONUS_MATCH_5: "tokens_consensus_validator_bonus_match_5",
} as const;

export const SETTING_DEFAULTS: Record<(typeof SETTING_KEYS)[keyof typeof SETTING_KEYS], string> = {
  [SETTING_KEYS.REPORTS_ENABLED]: "true",
  [SETTING_KEYS.DEFAULT_TOKENS_NEW_USER]: "10",
  [SETTING_KEYS.TOKENS_REWARD_APPROVED_REPORT]: "5",
  [SETTING_KEYS.TOKENS_DEDUCT_FALSE_REPORT]: "3",
  [SETTING_KEYS.TOKENS_DEDUCT_PROBLEMATIC_REPORT]: "1",
  [SETTING_KEYS.TOKENS_REWARD_INVITED_ACTIVITY]: "2",
  [SETTING_KEYS.MAX_INVITE_CODES_UNUSED]: "5",
  [SETTING_KEYS.MIN_APPROVED_REPORTS_FOR_APPROVAL]: "5",
  [SETTING_KEYS.REPORT_VALIDATOR_SLA_HOURS]: "48",
  [SETTING_KEYS.REPORT_UNASSIGNED_GRACE_MINUTES]: "5",
  [SETTING_KEYS.REPORT_PARALLEL_VALIDATORS]: "3",
  [SETTING_KEYS.REPORT_CONSENSUS_MIN_REVIEWS]: "3",
  [SETTING_KEYS.TOKENS_CONSENSUS_REPORTER_ACCEPT]: "5",
  [SETTING_KEYS.TOKENS_CONSENSUS_REPORTER_REJECT_PENALTY]: "3",
  [SETTING_KEYS.TOKENS_CONSENSUS_VALIDATOR_CORRECT]: "2",
  [SETTING_KEYS.TOKENS_CONSENSUS_VALIDATOR_WRONG_PENALTY]: "2",
  [SETTING_KEYS.TOKENS_CONSENSUS_VALIDATOR_REFUND]: "2",
  [SETTING_KEYS.TOKENS_CONSENSUS_VALIDATOR_BONUS_MATCH_3]: "1.5",
  [SETTING_KEYS.TOKENS_CONSENSUS_VALIDATOR_BONUS_MATCH_5]: "2",
};

export type SettingsMap = Record<string, string | number | boolean>;

/** Get a single setting value, returns default if not found */
export async function getSetting<K extends keyof typeof SETTING_KEYS>(
  key: (typeof SETTING_KEYS)[K],
): Promise<string> {
  const row = await prisma.setting.findUnique({ where: { key } });
  if (row) return row.value;
  return SETTING_DEFAULTS[key] ?? "";
}

/** Get setting as number */
export async function getSettingNumber<K extends keyof typeof SETTING_KEYS>(
  key: (typeof SETTING_KEYS)[K],
): Promise<number> {
  const v = await getSetting(key);
  const n = Number.parseInt(v, 10);
  return Number.isNaN(n) ? 0 : n;
}

/** مقدار عددی اعشاری (برای پاداش ۱.۵ و مشابه) */
export async function getSettingFloat<K extends keyof typeof SETTING_KEYS>(
  key: (typeof SETTING_KEYS)[K],
): Promise<number> {
  const v = await getSetting(key);
  const n = Number.parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

/** Get setting as boolean */
export async function getSettingBool<K extends keyof typeof SETTING_KEYS>(
  key: (typeof SETTING_KEYS)[K],
): Promise<boolean> {
  const v = await getSetting(key);
  return v === "true" || v === "1";
}

/** Get all settings as a map */
export async function getAllSettings(): Promise<SettingsMap> {
  const rows = await prisma.setting.findMany();
  const result: SettingsMap = { ...SETTING_DEFAULTS };
  for (const row of rows) {
    const def = SETTING_DEFAULTS[row.key as keyof typeof SETTING_DEFAULTS];
    if (def === "true" || def === "false") {
      result[row.key] = row.value === "true" || row.value === "1";
    } else if (def && !Number.isNaN(Number(def))) {
      result[row.key] = Number.parseInt(row.value, 10) || 0;
    } else {
      result[row.key] = row.value;
    }
  }
  return result;
}

/** Set a single setting */
export async function setSetting(key: string, value: string | number | boolean): Promise<void> {
  const str = typeof value === "boolean" ? (value ? "true" : "false") : String(value);
  await prisma.setting.upsert({
    where: { key },
    create: { key, value: str },
    update: { value: str },
  });
}

/** Set multiple settings */
export async function setSettings(settings: SettingsMap): Promise<void> {
  for (const [key, value] of Object.entries(settings)) {
    await setSetting(key, value);
  }
}
