import { Elysia } from "elysia";
import { prisma } from "../../db";
import { auth as authLib } from "@/lib/auth";
import { getAdminPanelSession } from "../admin-panel-auth";
import { documentToServeUrl } from "../upload";

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

export function getAuditCtx(
  auth: AdminAuth,
  ctx: { ip?: { address?: string }; userAgent?: string },
): {
  userId?: string;
  adminPanelUserId?: string;
  adminPanelUsername?: string;
  ipAddress?: string;
  userAgent?: string;
} {
  return {
    userId: auth.type === "user" ? auth.session.user.id : undefined,
    adminPanelUserId: auth.type === "panel" ? auth.adminPanelUser.id : undefined,
    adminPanelUsername: auth.type === "panel" ? auth.adminPanelUser.username : undefined,
    ipAddress: ctx.ip?.address,
    userAgent: ctx.userAgent,
  };
}

export const adminGuard = new Elysia({ name: "adminGuard" }).derive(async ({ request }) => {
  const session = await getSession(request.headers);
  if (session?.user?.id) {
    const admin = await prisma.admin.findUnique({
      where: { userId: session.user.id },
    });
    if (admin) return { auth: { type: "user", session, admin } };
  }
  const panel = await getAdminPanelSession(request);
  if (panel)
    return {
      auth: { type: "panel" as const, adminPanelUser: panel.adminPanelUser },
    };
  throw new Error("Unauthorized");
});
