import { prisma } from "../db";
import { getSettingNumber, SETTING_KEYS } from "./settings";

const LAST_ASSIGNED_INDEX_KEY = "last_assigned_validator_index";

export type ReportAssignmentReason = "initial" | "stale_reassign";

async function listValidatorsOrdered() {
  return prisma.user.findMany({
    where: { role: "validator" },
    select: { id: true },
    orderBy: { id: "asc" },
  });
}

/** Pick `count` distinct validators in round-robin order; advances global cursor. */
async function pickNextNValidators(count: number): Promise<string[]> {
  const validators = await listValidatorsOrdered();
  if (validators.length === 0 || count < 1) return [];

  const k = Math.min(count, validators.length);
  const setting = await prisma.setting.findUnique({
    where: { key: LAST_ASSIGNED_INDEX_KEY },
  });
  let lastIndex = setting ? Number.parseInt(setting.value, 10) : -1;
  if (Number.isNaN(lastIndex)) lastIndex = -1;

  const start = (lastIndex + 1) % validators.length;
  const ids: string[] = [];
  for (let i = 0; i < k; i++) {
    ids.push(validators[(start + i) % validators.length].id);
  }
  const newLastIndex = (start + k - 1) % validators.length;

  await prisma.setting.upsert({
    where: { key: LAST_ASSIGNED_INDEX_KEY },
    create: { key: LAST_ASSIGNED_INDEX_KEY, value: String(newLastIndex) },
    update: { value: String(newLastIndex) },
  });

  return ids;
}

/** Next validator after current (for SLA reassign); different person when possible. */
function pickNextAfterCurrent(validators: { id: string }[], currentId: string): string | null {
  if (validators.length === 0) return null;
  const idx = validators.findIndex((v) => v.id === currentId);
  if (idx === -1) return validators[0]?.id ?? null;
  if (validators.length === 1) return validators[0].id;
  return validators[(idx + 1) % validators.length].id;
}

/** Keeps `Report.assignedTo` / `assignedAt` aligned with oldest active slot (نمایش و سازگاری). */
export async function syncReportPrimaryAssignee(reportId: string): Promise<void> {
  const first = await prisma.reportValidatorAssignment.findFirst({
    where: { reportId, replacedAt: null },
    orderBy: { assignedAt: "asc" },
    select: { validatorId: true, assignedAt: true },
  });
  await prisma.report.update({
    where: { id: reportId },
    data: {
      assignedTo: first?.validatorId ?? null,
      assignedAt: first?.assignedAt ?? null,
    },
  });
}

export async function validatorMayActOnReport(
  reportId: string,
  validatorUserId: string,
  assignedToLegacy: string | null,
): Promise<boolean> {
  const active = await prisma.reportValidatorAssignment.findFirst({
    where: { reportId, validatorId: validatorUserId, replacedAt: null },
  });
  if (active) return true;
  return assignedToLegacy === validatorUserId;
}

/**
 * First-time assignment: several parallel active slots. Idempotent if any active slot exists.
 */
export async function assignReportFromQueue(reportId: string): Promise<boolean> {
  if (!reportId) return false;

  const report = await prisma.report.findUnique({
    where: { id: reportId },
    select: { id: true, status: true },
  });
  if (!report || report.status !== "pending") return false;

  const activeCount = await prisma.reportValidatorAssignment.count({
    where: { reportId, replacedAt: null },
  });
  if (activeCount > 0) return false;

  const parallel = await getSettingNumber(SETTING_KEYS.REPORT_PARALLEL_VALIDATORS);
  const n = Math.min(Math.max(1, parallel), 50);
  const validatorIds = await pickNextNValidators(n);
  if (validatorIds.length === 0) return false;

  const now = new Date();
  await prisma.$transaction([
    ...validatorIds.map((validatorId) =>
      prisma.reportValidatorAssignment.create({
        data: {
          reportId,
          validatorId,
          assignedAt: now,
          reason: "initial",
        },
      }),
    ),
    prisma.report.update({
      where: { id: reportId },
      data: { assignedTo: validatorIds[0], assignedAt: now },
    }),
  ]);
  return true;
}

async function reassignStaleSlot(slot: {
  id: string;
  reportId: string;
  validatorId: string;
}): Promise<boolean> {
  const validators = await listValidatorsOrdered();
  const nextId = pickNextAfterCurrent(validators, slot.validatorId);
  if (!nextId) return false;

  const now = new Date();
  await prisma.$transaction([
    prisma.reportValidatorAssignment.update({
      where: { id: slot.id },
      data: { replacedAt: now },
    }),
    prisma.reportValidatorAssignment.create({
      data: {
        reportId: slot.reportId,
        validatorId: nextId,
        assignedAt: now,
        reason: "stale_reassign",
      },
    }),
  ]);
  await syncReportPrimaryAssignee(slot.reportId);
  return true;
}

/**
 * Scan DB for SLA violations per active slot and stuck reports without any active slot.
 */
export async function scanAndReassignStaleReports(): Promise<{
  slaReassigned: number;
  unassignedAssigned: number;
}> {
  const slaHours = await getSettingNumber(SETTING_KEYS.REPORT_VALIDATOR_SLA_HOURS);
  const graceMin = await getSettingNumber(SETTING_KEYS.REPORT_UNASSIGNED_GRACE_MINUTES);
  const slaMs = Math.max(1, slaHours) * 3600 * 1000;
  const graceMs = Math.max(1, graceMin) * 60 * 1000;
  const slaCutoff = new Date(Date.now() - slaMs);
  const graceCutoff = new Date(Date.now() - graceMs);

  const staleSlots = await prisma.reportValidatorAssignment.findMany({
    where: {
      replacedAt: null,
      assignedAt: { lt: slaCutoff },
      report: { status: "pending" },
    },
    select: { id: true, reportId: true, validatorId: true, assignedAt: true },
  });

  let slaReassigned = 0;
  for (const slot of staleSlots) {
    const reviewed = await prisma.reportReview.findFirst({
      where: {
        reportId: slot.reportId,
        reviewerId: slot.validatorId,
        createdAt: { gte: slot.assignedAt },
      },
    });
    if (reviewed) continue;
    const ok = await reassignStaleSlot(slot);
    if (ok) slaReassigned += 1;
  }

  const stuckUnassigned = await prisma.report.findMany({
    where: {
      status: "pending",
      createdAt: { lt: graceCutoff },
      NOT: {
        validatorAssignments: {
          some: { replacedAt: null },
        },
      },
    },
    select: { id: true },
  });

  let unassignedAssigned = 0;
  for (const r of stuckUnassigned) {
    const ok = await assignReportFromQueue(r.id);
    if (ok) unassignedAssigned += 1;
  }

  return { slaReassigned, unassignedAssigned };
}
