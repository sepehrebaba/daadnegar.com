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

/** Round-robin pick; advances global cursor. Used for first-time assignment. */
async function pickNextValidatorRoundRobin(): Promise<string | null> {
  const validators = await listValidatorsOrdered();
  if (validators.length === 0) return null;

  const setting = await prisma.setting.findUnique({
    where: { key: LAST_ASSIGNED_INDEX_KEY },
  });
  let lastIndex = setting ? Number.parseInt(setting.value, 10) : -1;
  if (Number.isNaN(lastIndex)) lastIndex = -1;
  const nextIndex = (lastIndex + 1) % validators.length;
  const chosen = validators[nextIndex];

  await prisma.setting.upsert({
    where: { key: LAST_ASSIGNED_INDEX_KEY },
    create: { key: LAST_ASSIGNED_INDEX_KEY, value: String(nextIndex) },
    update: { value: String(nextIndex) },
  });

  return chosen.id;
}

/** Next validator after current (for SLA reassign); different person when possible. */
function pickNextAfterCurrent(validators: { id: string }[], currentId: string): string | null {
  if (validators.length === 0) return null;
  const idx = validators.findIndex((v) => v.id === currentId);
  if (idx === -1) return validators[0]?.id ?? null;
  if (validators.length === 1) return validators[0].id;
  return validators[(idx + 1) % validators.length].id;
}

/**
 * First-time assignment from report.submitted. Idempotent if already assigned.
 */
export async function assignReportFromQueue(reportId: string): Promise<boolean> {
  if (!reportId) return false;

  const report = await prisma.report.findUnique({
    where: { id: reportId },
    select: { id: true, status: true, assignedTo: true },
  });
  if (!report || report.status !== "pending") return false;
  if (report.assignedTo) return false;

  const validatorId = await pickNextValidatorRoundRobin();
  if (!validatorId) return false;

  const now = new Date();
  await prisma.$transaction([
    prisma.report.update({
      where: { id: reportId },
      data: { assignedTo: validatorId, assignedAt: now },
    }),
    prisma.reportValidatorAssignment.create({
      data: {
        reportId,
        validatorId,
        assignedAt: now,
        reason: "initial",
      },
    }),
  ]);
  return true;
}

/**
 * Reassign a pending report to another validator (SLA breach). No-op if not pending / no assignee.
 */
export async function reassignStaleReport(reportId: string): Promise<boolean> {
  const report = await prisma.report.findUnique({
    where: { id: reportId },
    select: { id: true, status: true, assignedTo: true },
  });
  if (!report || report.status !== "pending" || !report.assignedTo) return false;

  const validators = await listValidatorsOrdered();
  const nextId = pickNextAfterCurrent(validators, report.assignedTo);
  if (!nextId) return false;

  const now = new Date();
  await prisma.$transaction([
    prisma.report.update({
      where: { id: reportId },
      data: { assignedTo: nextId, assignedAt: now },
    }),
    prisma.reportValidatorAssignment.create({
      data: {
        reportId,
        validatorId: nextId,
        assignedAt: now,
        reason: "stale_reassign",
      },
    }),
  ]);
  return true;
}

/**
 * Scan DB for SLA violations and stuck unassigned reports; reassign / assign each.
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

  const staleCandidates = await prisma.report.findMany({
    where: {
      status: "pending",
      assignedTo: { not: null },
      assignedAt: { lt: slaCutoff },
    },
    select: { id: true, assignedTo: true, assignedAt: true },
  });

  let slaReassigned = 0;
  for (const r of staleCandidates) {
    if (!r.assignedTo || !r.assignedAt) continue;
    const reviewed = await prisma.reportReview.findFirst({
      where: {
        reportId: r.id,
        reviewerId: r.assignedTo,
        createdAt: { gte: r.assignedAt },
      },
    });
    if (reviewed) continue;
    const ok = await reassignStaleReport(r.id);
    if (ok) slaReassigned += 1;
  }

  const stuckUnassigned = await prisma.report.findMany({
    where: {
      status: "pending",
      assignedTo: null,
      createdAt: { lt: graceCutoff },
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
