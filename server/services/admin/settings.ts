import { Elysia, t } from "elysia";
import { getAllSettings, setSettings, SETTING_KEYS, type SettingsMap } from "../../lib/settings";
import { createAuditLog } from "../audit";
import { getAuditCtx } from "./shared";

export const adminSettingsRoutes = new Elysia({ name: "adminSettings" })
  .get("/settings", async () => {
    const data = await getAllSettings();
    return { data };
  })
  .put(
    "/settings",
    async ({ body, request, ip, auth }) => {
      const allowedKeys = new Set(Object.values(SETTING_KEYS));
      const toSet: SettingsMap = {};
      for (const [key, value] of Object.entries(body)) {
        if (allowedKeys.has(key)) toSet[key] = value;
      }
      await setSettings(toSet);
      await createAuditLog({
        action: "update",
        entity: "Setting",
        entityId: "system",
        details: JSON.stringify(toSet),
        ctx: getAuditCtx(auth, {
          ip,
          userAgent: request.headers.get("user-agent") ?? undefined,
        }),
      });
      return { data: await getAllSettings() };
    },
    {
      body: t.Object({
        reports_enabled: t.Optional(t.Boolean()),
        default_tokens_new_user: t.Optional(t.Number()),
        tokens_report_submit_stake: t.Optional(t.Number()),
        tokens_reward_approved_report: t.Optional(t.Number()),
        tokens_deduct_false_report: t.Optional(t.Number()),
        tokens_deduct_problematic_report: t.Optional(t.Number()),
        tokens_reward_invited_activity: t.Optional(t.Number()),
        tokens_invite_create_stake: t.Optional(t.Number()),
        max_invite_codes_unused: t.Optional(t.Number()),
        min_approved_reports_for_approval: t.Optional(t.Number()),
        report_validator_sla_hours: t.Optional(t.Number()),
        report_unassigned_grace_minutes: t.Optional(t.Number()),
        report_parallel_validators: t.Optional(t.Number()),
        report_consensus_min_reviews: t.Optional(t.Number()),
        tokens_consensus_reporter_accept: t.Optional(t.Number()),
        tokens_consensus_reporter_reject_penalty: t.Optional(t.Number()),
        tokens_consensus_validator_correct: t.Optional(t.Number()),
        tokens_consensus_validator_wrong_penalty: t.Optional(t.Number()),
        tokens_consensus_validator_refund: t.Optional(t.Number()),
        tokens_consensus_validator_bonus_match_3: t.Optional(t.Number()),
        tokens_consensus_validator_bonus_match_5: t.Optional(t.Number()),
      }),
    },
  );
