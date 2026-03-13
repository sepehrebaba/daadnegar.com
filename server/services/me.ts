import { Elysia } from "elysia";
import { prisma } from "../db";
import { auth } from "@/lib/auth";
import { createAuditLog } from "./audit";
import { resolveInviteToken } from "../lib/auth-invite";
import { getSettingNumber, SETTING_KEYS } from "../lib/settings";

async function getSession(headers: Headers) {
  return auth.api.getSession({ headers });
}

export const meService = new Elysia({ prefix: "/me", aot: false })
  .post("/logout", async ({ request, ip }) => {
    const authHeader = request.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7).trim();
      if (token) {
        const session = await prisma.inviteSession.findFirst({
          where: { token },
          include: { user: true, inviteCode: true },
        });
        if (session?.userId) {
          await createAuditLog({
            action: "logout",
            entity: "User",
            entityId: session.userId,
            details: JSON.stringify({ inviteCode: session.inviteCode?.code }),
            ctx: {
              userId: session.userId,
              ipAddress: ip?.address,
              userAgent: request.headers.get("user-agent") ?? undefined,
            },
          });
        }
        await prisma.inviteSession.deleteMany({ where: { token } });
      }
    }
    return { success: true };
  })
  .derive(async ({ request }) => {
    let session = await getSession(request.headers);
    if (!session?.user && request.headers) {
      const inviteUser = await resolveInviteToken(request.headers.get("Authorization"));
      if (inviteUser) {
        session = {
          user: {
            id: inviteUser.userId,
            name: inviteUser.name,
            email: inviteUser.email,
            image: null,
            emailVerified: null,
            role: inviteUser.role ?? "user",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          session: null,
        };
      }
    }
    return { session };
  })
  .get("/", async ({ session }) => {
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }
    const [user, approvedRequestsCount, minApprovedReportsForApproval] = await Promise.all([
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { tokenBalance: true, role: true },
      }),
      prisma.report.count({
        where: { userId: session.user.id, status: "accepted" },
      }),
      getSettingNumber(SETTING_KEYS.MIN_APPROVED_REPORTS_FOR_APPROVAL),
    ]);
    return {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      image: session.user.image,
      passkey: "",
      inviteCode: "",
      isActivated: true,
      tokensCount: user?.tokenBalance ?? 0,
      approvedRequestsCount,
      role: user?.role ?? session.user.role ?? "user",
      minApprovedReportsForApproval,
    };
  })
  .get("/transactions", async ({ session }) => {
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }
    const transactions = await prisma.tokenTransaction.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { id: true, amount: true, type: true, createdAt: true },
    });
    return transactions;
  });
