import { Elysia } from "elysia";
import { ip } from "elysia-ip";
import { prisma } from "../../db";
import { auth as authLib } from "@/lib/auth";
import { getAdminPanelSession } from "./auth";
import { documentToServeUrl } from "../panel/upload";

export function mapReportDocuments<
  T extends { documents?: { id: string; name: string; url: string }[] },
>(r: T): T {
  if (!r?.documents?.length) return r;
  return {
    ...r,
    documents: r.documents.map((d) => ({ ...d, url: documentToServeUrl(d) })),
  };
}

async function getSession(headers: Headers) {
  return authLib.api.getSession({ headers });
}

export type AdminAuth =
  | {
      type: "user";
      session: NonNullable<Awaited<ReturnType<typeof getSession>>>;
      admin: { id: string };
    }
  | { type: "panel"; adminPanelUser: { id: string; username: string } };

/** Resolve admin API auth. Used from `adminService.derive` so `auth` reaches nested `.use()` route plugins (Elysia 1.4). */
export async function resolveAdminAuth(request: Request): Promise<AdminAuth> {
  const session = await getSession(request.headers);
  if (session?.user?.id) {
    const admin = await prisma.admin.findUnique({
      where: { userId: session.user.id },
    });
    if (admin) return { type: "user", session, admin };
  }
  const panel = await getAdminPanelSession(request);
  if (panel) return { type: "panel", adminPanelUser: panel.adminPanelUser };
  throw new Error("Unauthorized");
}

export function getAuditCtx(
  auth: AdminAuth | undefined,
  ctx: { ip?: string; userAgent?: string },
): {
  userId?: string;
  adminPanelUserId?: string;
  adminPanelUsername?: string;
  ipAddress?: string;
  userAgent?: string;
} {
  if (!auth) {
    return {
      ipAddress: ctx.ip,
      userAgent: ctx.userAgent,
    };
  }
  return {
    userId: auth.type === "user" ? auth.session.user.id : undefined,
    adminPanelUserId: auth.type === "panel" ? auth.adminPanelUser.id : undefined,
    adminPanelUsername: auth.type === "panel" ? auth.adminPanelUser.username : undefined,
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  };
}

export const adminGuard = new Elysia({ name: "adminGuard" })
  .use(ip())
  .derive({ as: "scoped" }, async ({ request }) => ({
    auth: await resolveAdminAuth(request),
  }));
