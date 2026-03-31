import { prisma } from "../db";

const AUDIT_DETAILS_SAFE_BYTES = 240;

export type AuditContext = {
  userId?: string;
  /** For admin panel; AdminPanelUser differs from User, so stored in details */
  adminPanelUserId?: string;
  adminPanelUsername?: string;
  ipAddress?: string;
  userAgent?: string;
};

function truncateUtf8(value: string, maxBytes: number): string {
  if (Buffer.byteLength(value, "utf8") <= maxBytes) return value;

  const marker = "… [truncated]";
  const markerBytes = Buffer.byteLength(marker, "utf8");
  const targetBytes = Math.max(0, maxBytes - markerBytes);

  let out = "";
  for (const ch of value) {
    const next = out + ch;
    if (Buffer.byteLength(next, "utf8") > targetBytes) break;
    out = next;
  }
  return out + marker;
}

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
  const data = {
    action: params.action,
    entity: params.entity,
    entityId: params.entityId,
    details,
    userId: ctx?.userId,
    ipAddress: ctx?.ipAddress,
    userAgent: ctx?.userAgent,
  };

  try {
    return await prisma.auditLog.create({ data });
  } catch (error) {
    const err = error as { code?: string; message?: string };
    const isDetailsTooLong = err.code === "P2000" && err.message?.includes("Column: details");

    if (!isDetailsTooLong || !details) {
      throw error;
    }

    return prisma.auditLog.create({
      data: {
        ...data,
        details: truncateUtf8(details, AUDIT_DETAILS_SAFE_BYTES),
      },
    });
  }
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
