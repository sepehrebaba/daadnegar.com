import { Elysia, t } from "elysia";
import { prisma } from "../../db";
import { auth as authLib } from "@/lib/auth";
import { createAuditLog } from "../audit";

/** Admin-panel invite codes, panel user accounts, audit log viewer. */
export const adminPanelRoutes = new Elysia({ name: "adminPanel" })
  .post(
    "/invitations",
    async ({ body }) => {
      const { ensureUniqueInviteCode } = await import("../panel/invite");
      const firstAdmin = await prisma.admin.findFirst();
      const inviterId = firstAdmin?.userId;
      if (!inviterId) throw new Error("No admin user found to create invitations");
      const code = await ensureUniqueInviteCode();
      const assignedRole = body.role === "validator" ? "validator" : "user";
      const invite = await prisma.inviteCode.create({
        data: {
          code,
          inviterId,
          assignedRole,
        },
      });
      await createAuditLog({
        action: "create",
        entity: "InviteCode",
        entityId: invite.id,
        details: JSON.stringify({
          code: invite.code,
          assignedRole: invite.assignedRole,
        }),
      });
      const baseURL =
        process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      return {
        ...invite,
        inviteLink: `${baseURL}/auth/register?code=${code}`,
      };
    },
    {
      body: t.Object(
        {
          username: t.Optional(t.String()),
          name: t.Optional(t.String()),
          expiresInDays: t.Optional(t.Number()),
          role: t.Optional(t.Union([t.Literal("user"), t.Literal("validator")])),
        },
        { additionalProperties: true },
      ),
    },
  )
  .get("/panel-users", async () => {
    const data = await prisma.adminPanelUser.findMany({
      select: { id: true, username: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
    return { data };
  })
  .post(
    "/panel-users",
    async ({ body }) => {
      const ctx = await authLib.$context;
      const passwordHash = await ctx.password.hash(body.password);
      const user = await prisma.adminPanelUser.create({
        data: { username: body.username, passwordHash },
      });
      await createAuditLog({
        action: "create",
        entity: "AdminPanelUser",
        entityId: user.id,
        details: JSON.stringify({ username: user.username }),
      });
      return {
        id: user.id,
        username: user.username,
        createdAt: user.createdAt,
      };
    },
    {
      body: t.Object({
        username: t.String(),
        password: t.String({ minLength: 8 }),
      }),
    },
  )
  .get("/audit-logs", async ({ query }) => {
    const where: Record<string, unknown> = {};
    if (query.entity?.trim()) where.entity = query.entity;
    if (query.userId?.trim()) where.userId = query.userId;
    const page = Number(query.page ?? 1);
    const perPage = Math.min(Number(query.perPage ?? 50), 100);
    const skip = (page - 1) * perPage;

    const [data, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: { user: { select: { id: true, name: true, username: true } } },
        orderBy: { createdAt: "desc" },
        skip,
        take: perPage,
      }),
      prisma.auditLog.count({ where }),
    ]);
    return { data, total, page, perPage };
  });
