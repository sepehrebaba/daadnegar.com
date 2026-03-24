import { Elysia, t } from "elysia";
import { prisma } from "../../db";
import { auth as authLib } from "@/lib/auth";
import { createAuditLog } from "../audit";
import { getAuditCtx } from "./shared";

export const adminUsersRoutes = new Elysia({ name: "adminUsers" })
  .get("/users", async () => {
    const data = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        createdAt: true,
        _count: { select: { reports: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return { data };
  })
  .put(
    "/users/:id/role",
    async ({ params, body, request, ip, auth }) => {
      const user = await prisma.user.update({
        where: { id: params.id },
        data: { role: body.role },
      });
      await createAuditLog({
        action: "update",
        entity: "User",
        entityId: user.id,
        details: JSON.stringify({ role: body.role }),
        ctx: getAuditCtx(auth, {
          ip,
          userAgent: request.headers.get("user-agent") ?? undefined,
        }),
      });
      return user;
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({
        role: t.Union([t.Literal("user"), t.Literal("validator")]),
      }),
    },
  )
  .put(
    "/users/:id/password",
    async ({ params, body, request, ip, auth: adminAuth }) => {
      if (body.password.length < 8) throw new Error("رمز عبور باید حداقل ۸ کاراکتر باشد");
      if (!/[$@#!%*?&#^()[\]{}_\-+=.,:;]/.test(body.password))
        throw new Error("رمز عبور باید حداقل یک کاراکتر خاص داشته باشد");
      if (!/[A-Z]/.test(body.password))
        throw new Error("رمز عبور باید حداقل یک حرف بزرگ داشته باشد");
      if (!/[a-z]/.test(body.password))
        throw new Error("رمز عبور باید حداقل یک حرف کوچک داشته باشد");
      if (!/[0-9]/.test(body.password)) throw new Error("رمز عبور باید حداقل یک عدد داشته باشد");

      const ctx = await authLib.$context;
      const passkeyHash = await ctx.password.hash(body.password);

      await prisma.$transaction(async (tx) => {
        await tx.inviteSession.updateMany({
          where: { userId: params.id },
          data: { passkeyHash },
        });
        await tx.account.updateMany({
          where: {
            userId: params.id,
            password: { not: null },
          },
          data: { password: passkeyHash },
        });
      });

      await createAuditLog({
        action: "update",
        entity: "User",
        entityId: params.id,
        details: JSON.stringify({ field: "password" }),
        ctx: getAuditCtx(adminAuth, {
          ip,
          userAgent: request.headers.get("user-agent") ?? undefined,
        }),
      });
      return { success: true };
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({ password: t.String({ minLength: 8 }) }),
    },
  );
