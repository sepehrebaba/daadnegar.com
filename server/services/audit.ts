import { prisma } from "../db";

export type AuditContext = {
  userId?: string;
  /** For admin panel; AdminPanelUser differs from User, so stored in details */
  adminPanelUserId?: string;
  adminPanelUsername?: string;
  ipAddress?: string;
  userAgent?: string;
};

function mergeDetails(
  base: string | undefined,
  extra: Record<string, unknown>,
): string | undefined {
  const hasExtra = Object.keys(extra).length > 0;
  if (!base && !hasExtra) return undefined;
  if (!hasExtra) return base;
  const parsed = base ? (JSON.parse(base) as Record<string, unknown>) : {};
  return JSON.stringify({ ...parsed, ...extra });
}

export async function createAuditLog(params: {
  action: string;
  entity: string;
  entityId?: string;
  details?: string;
  ctx?: AuditContext;
}) {
  const ctx = params.ctx;
  let details = params.details;
  if (ctx?.adminPanelUserId) {
    details = mergeDetails(details, {
      actorType: "admin_panel",
      actorId: ctx.adminPanelUserId,
      actorUsername: ctx.adminPanelUsername,
    });
  }
  return prisma.auditLog.create({
    data: {
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      details,
      userId: ctx?.userId,
      ipAddress: ctx?.ipAddress,
      userAgent: ctx?.userAgent,
    },
  });
}

/**
 * Simple helper to log actions.
 * Call before or after an operation.
 */
export type LogActionParams = {
  action: string;
  entity: string;
  entityId?: string;
  details?: string | Record<string, unknown>;
  request: Request;
  ip?: { address?: string };
  userId?: string;
  adminPanelUserId?: string;
  adminPanelUsername?: string;
};

export async function logAction(params: LogActionParams) {
  const details =
    typeof params.details === "object"
      ? Object.keys(params.details).length > 0
        ? JSON.stringify(params.details)
        : undefined
      : params.details;
  return createAuditLog({
    action: params.action,
    entity: params.entity,
    entityId: params.entityId,
    details,
    ctx: {
      userId: params.userId,
      adminPanelUserId: params.adminPanelUserId,
      adminPanelUsername: params.adminPanelUsername,
      ipAddress: params.ip?.address,
      userAgent: params.request.headers.get("user-agent") ?? undefined,
    },
  });
}
