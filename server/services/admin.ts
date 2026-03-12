import { Elysia, t } from "elysia";
import { prisma } from "../db";
import { getAllSettings, setSettings, SETTING_KEYS, type SettingsMap } from "../lib/settings";
import { createAuditLog } from "./audit";
import { auth } from "@/lib/auth";
import { getAdminPanelSession } from "./admin-panel-auth";

async function getSession(headers: Headers) {
  return auth.api.getSession({ headers });
}

export type AdminAuth =
  | {
      type: "user";
      session: NonNullable<Awaited<ReturnType<typeof getSession>>>;
      admin: { id: string };
    }
  | { type: "panel"; adminPanelUser: { id: string; username: string } };

function getAuditCtx(
  auth: AdminAuth,
  ctx: { ip?: { address?: string }; userAgent?: string },
): { userId?: string; ipAddress?: string; userAgent?: string } {
  return {
    userId: auth.type === "user" ? auth.session.user.id : undefined,
    ipAddress: ctx.ip?.address,
    userAgent: ctx.userAgent,
  };
}

const adminGuard = new Elysia({ name: "adminGuard" }).derive(async ({ request }) => {
  const session = await getSession(request.headers);
  if (session?.user?.id) {
    const admin = await prisma.admin.findUnique({ where: { userId: session.user.id } });
    if (admin) return { auth: { type: "user", session, admin } };
  }
  const panel = await getAdminPanelSession(request);
  if (panel) return { auth: { type: "panel" as const, adminPanelUser: panel.adminPanelUser } };
  throw new Error("Unauthorized");
});

export const adminService = new Elysia({ prefix: "/admin", aot: false })
  .use(adminGuard)
  // Settings
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
        ctx: getAuditCtx(auth, { ip, userAgent: request.headers.get("user-agent") ?? undefined }),
      });
      return { data: await getAllSettings() };
    },
    {
      body: t.Object({
        reports_enabled: t.Optional(t.Boolean()),
        default_tokens_new_user: t.Optional(t.Number()),
        tokens_reward_approved_report: t.Optional(t.Number()),
        tokens_deduct_false_report: t.Optional(t.Number()),
        tokens_deduct_problematic_report: t.Optional(t.Number()),
        tokens_reward_invited_activity: t.Optional(t.Number()),
      }),
    },
  )
  // Categories
  .get("/categories", async ({ ip }) => {
    const data = await prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
    });
    return { data };
  })
  .post(
    "/categories",
    async ({ body, request, ip, auth }) => {
      const cat = await prisma.category.create({
        data: {
          name: body.name,
          slug: body.slug,
          description: body.description,
          type: body.type ?? "report",
          sortOrder: body.sortOrder ?? 0,
          isActive: body.isActive ?? true,
          parentId: body.parentId,
        },
      });
      await createAuditLog({
        action: "create",
        entity: "Category",
        entityId: cat.id,
        details: JSON.stringify({ name: cat.name, slug: cat.slug }),
        ctx: getAuditCtx(auth, { ip, userAgent: request.headers.get("user-agent") ?? undefined }),
      });
      return cat;
    },
    {
      body: t.Object({
        name: t.String(),
        slug: t.String(),
        description: t.Optional(t.String()),
        type: t.Optional(t.String()),
        sortOrder: t.Optional(t.Number()),
        isActive: t.Optional(t.Boolean()),
        parentId: t.Optional(t.String()),
      }),
    },
  )
  .put(
    "/categories/:id",
    async ({ params, body, request, ip, auth }) => {
      const cat = await prisma.category.update({
        where: { id: params.id },
        data: {
          ...(body.name != null && { name: body.name }),
          ...(body.slug != null && { slug: body.slug }),
          ...(body.description != null && { description: body.description }),
          ...(body.type != null && { type: body.type }),
          ...(body.sortOrder != null && { sortOrder: body.sortOrder }),
          ...(body.isActive != null && { isActive: body.isActive }),
          ...(body.parentId != null && { parentId: body.parentId }),
        },
      });
      await createAuditLog({
        action: "update",
        entity: "Category",
        entityId: cat.id,
        details: JSON.stringify(body),
        ctx: getAuditCtx(auth, { ip, userAgent: request.headers.get("user-agent") ?? undefined }),
      });
      return cat;
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({
        name: t.Optional(t.String()),
        slug: t.Optional(t.String()),
        description: t.Optional(t.String()),
        type: t.Optional(t.String()),
        sortOrder: t.Optional(t.Number()),
        isActive: t.Optional(t.Boolean()),
        parentId: t.Optional(t.Nullable(t.String())),
      }),
    },
  )
  .delete(
    "/categories/:id",
    async ({ params, request, ip, auth }) => {
      await prisma.category.delete({ where: { id: params.id } });
      await createAuditLog({
        action: "delete",
        entity: "Category",
        entityId: params.id,
        ctx: getAuditCtx(auth, { ip, userAgent: request.headers.get("user-agent") ?? undefined }),
      });
      return { success: true };
    },
    { params: t.Object({ id: t.String() }) },
  )
  // Provinces
  .get("/provinces", async () => {
    const data = await prisma.province.findMany({
      include: { cities: { orderBy: { sortOrder: "asc" } } },
      orderBy: { sortOrder: "asc" },
    });
    return { data };
  })
  .post(
    "/provinces",
    async ({ body, request, ip, auth }) => {
      const province = await prisma.province.create({
        data: {
          name: body.name,
          sortOrder: body.sortOrder ?? 0,
        },
      });
      await createAuditLog({
        action: "create",
        entity: "Province",
        entityId: province.id,
        details: JSON.stringify({ name: province.name }),
        ctx: getAuditCtx(auth, { ip, userAgent: request.headers.get("user-agent") ?? undefined }),
      });
      return province;
    },
    { body: t.Object({ name: t.String(), sortOrder: t.Optional(t.Number()) }) },
  )
  .put(
    "/provinces/:id",
    async ({ params, body, request, ip, auth }) => {
      const province = await prisma.province.update({
        where: { id: params.id },
        data: {
          ...(body.name != null && { name: body.name }),
          ...(body.sortOrder != null && { sortOrder: body.sortOrder }),
        },
      });
      await createAuditLog({
        action: "update",
        entity: "Province",
        entityId: province.id,
        details: JSON.stringify(body),
        ctx: getAuditCtx(auth, { ip, userAgent: request.headers.get("user-agent") ?? undefined }),
      });
      return province;
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({ name: t.Optional(t.String()), sortOrder: t.Optional(t.Number()) }),
    },
  )
  .delete(
    "/provinces/:id",
    async ({ params, request, ip, auth }) => {
      await prisma.province.delete({ where: { id: params.id } });
      await createAuditLog({
        action: "delete",
        entity: "Province",
        entityId: params.id,
        ctx: getAuditCtx(auth, { ip, userAgent: request.headers.get("user-agent") ?? undefined }),
      });
      return { success: true };
    },
    { params: t.Object({ id: t.String() }) },
  )
  // Cities
  .get("/cities", async ({ query }) => {
    const where: Record<string, unknown> = {};
    if (query.provinceId?.trim()) where.provinceId = query.provinceId;
    const data = await prisma.city.findMany({
      where,
      include: { province: { select: { id: true, name: true } } },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
    return { data };
  })
  .post(
    "/cities",
    async ({ body, request, ip, auth }) => {
      const city = await prisma.city.create({
        data: {
          name: body.name,
          provinceId: body.provinceId,
          sortOrder: body.sortOrder ?? 0,
        },
      });
      await createAuditLog({
        action: "create",
        entity: "City",
        entityId: city.id,
        details: JSON.stringify({ name: city.name, provinceId: city.provinceId }),
        ctx: getAuditCtx(auth, { ip, userAgent: request.headers.get("user-agent") ?? undefined }),
      });
      return city;
    },
    {
      body: t.Object({
        name: t.String(),
        provinceId: t.String(),
        sortOrder: t.Optional(t.Number()),
      }),
    },
  )
  .put(
    "/cities/:id",
    async ({ params, body, request, ip, auth }) => {
      const city = await prisma.city.update({
        where: { id: params.id },
        data: {
          ...(body.name != null && { name: body.name }),
          ...(body.provinceId != null && { provinceId: body.provinceId }),
          ...(body.sortOrder != null && { sortOrder: body.sortOrder }),
        },
      });
      await createAuditLog({
        action: "update",
        entity: "City",
        entityId: city.id,
        details: JSON.stringify(body),
        ctx: getAuditCtx(auth, { ip, userAgent: request.headers.get("user-agent") ?? undefined }),
      });
      return city;
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({
        name: t.Optional(t.String()),
        provinceId: t.Optional(t.String()),
        sortOrder: t.Optional(t.Number()),
      }),
    },
  )
  .delete(
    "/cities/:id",
    async ({ params, request, ip, auth }) => {
      await prisma.city.delete({ where: { id: params.id } });
      await createAuditLog({
        action: "delete",
        entity: "City",
        entityId: params.id,
        ctx: getAuditCtx(auth, { ip, userAgent: request.headers.get("user-agent") ?? undefined }),
      });
      return { success: true };
    },
    { params: t.Object({ id: t.String() }) },
  )
  // Users
  .get("/users", async () => {
    const data = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
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
        ctx: getAuditCtx(auth, { ip, userAgent: request.headers.get("user-agent") ?? undefined }),
      });
      return user;
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({ role: t.Union([t.Literal("user"), t.Literal("validator")]) }),
    },
  )
  // People
  .get("/people", async ({ query }) => {
    const where: Record<string, unknown> = {};
    if (query.famous != null) {
      where.isFamous = query.famous === "true";
    }
    if (query.search?.trim()) {
      const s = `%${query.search.trim()}%`;
      where.OR = [{ firstName: { contains: s } }, { lastName: { contains: s } }];
    }
    const data = await prisma.person.findMany({
      where,
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      take: query.limit ? Number(query.limit) : 100,
    });
    return { data };
  })
  .post(
    "/people",
    async ({ body, request, ip, auth }) => {
      const person = await prisma.person.create({
        data: {
          firstName: body.firstName,
          lastName: body.lastName,
          nationalCode: body.nationalCode,
          imageUrl: body.imageUrl,
          title: body.title,
          isFamous: body.isFamous ?? false,
        },
      });
      await createAuditLog({
        action: "create",
        entity: "Person",
        entityId: person.id,
        details: JSON.stringify({ firstName: person.firstName, lastName: person.lastName }),
        ctx: getAuditCtx(auth, { ip, userAgent: request.headers.get("user-agent") ?? undefined }),
      });
      return person;
    },
    {
      body: t.Object({
        firstName: t.String(),
        lastName: t.String(),
        nationalCode: t.Optional(t.String()),
        imageUrl: t.Optional(t.String()),
        title: t.Optional(t.String()),
        isFamous: t.Optional(t.Boolean()),
      }),
    },
  )
  .put(
    "/people/:id",
    async ({ params, body, request, ip, auth }) => {
      const person = await prisma.person.update({
        where: { id: params.id },
        data: {
          ...(body.firstName != null && { firstName: body.firstName }),
          ...(body.lastName != null && { lastName: body.lastName }),
          ...(body.nationalCode != null && { nationalCode: body.nationalCode }),
          ...(body.imageUrl != null && { imageUrl: body.imageUrl }),
          ...(body.title != null && { title: body.title }),
          ...(body.isFamous != null && { isFamous: body.isFamous }),
        },
      });
      await createAuditLog({
        action: "update",
        entity: "Person",
        entityId: person.id,
        details: JSON.stringify(body),
        ctx: getAuditCtx(auth, { ip, userAgent: request.headers.get("user-agent") ?? undefined }),
      });
      return person;
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({
        firstName: t.Optional(t.String()),
        lastName: t.Optional(t.String()),
        nationalCode: t.Optional(t.String()),
        imageUrl: t.Optional(t.String()),
        title: t.Optional(t.String()),
        isFamous: t.Optional(t.Boolean()),
      }),
    },
  )
  .delete(
    "/people/:id",
    async ({ params, request, ip, auth }) => {
      await prisma.person.delete({ where: { id: params.id } });
      await createAuditLog({
        action: "delete",
        entity: "Person",
        entityId: params.id,
        ctx: getAuditCtx(auth, { ip, userAgent: request.headers.get("user-agent") ?? undefined }),
      });
      return { success: true };
    },
    { params: t.Object({ id: t.String() }) },
  )
  // Reports
  .get(
    "/reports/:id",
    async ({ params }) => {
      const report = await prisma.report.findUnique({
        where: { id: params.id },
        include: {
          person: true,
          user: { select: { id: true, name: true, email: true } },
          category: true,
          subcategory: true,
          documents: true,
        },
      });
      if (!report) throw new Error("Not found");
      return report;
    },
    { params: t.Object({ id: t.String() }) },
  )
  .get("/reports", async ({ query }) => {
    const where: Record<string, unknown> = {};
    if (query.status?.trim()) where.status = query.status;
    const page = Number(query.page ?? 1);
    const perPage = Math.min(Number(query.perPage ?? 25), 100);
    const skip = (page - 1) * perPage;
    const [data, total] = await Promise.all([
      prisma.report.findMany({
        where,
        include: { person: true, user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "desc" },
        skip,
        take: perPage,
      }),
      prisma.report.count({ where }),
    ]);
    return { data, total, page, perPage };
  })
  .put(
    "/reports/:id",
    async ({ params, body, request, ip, auth }) => {
      const existing = await prisma.report.findUnique({
        where: { id: params.id },
        include: { user: { select: { id: true, tokenBalance: true } } },
      });
      if (!existing) throw new Error("Not found");

      const rejectionReason =
        body.status === "rejected" ? (body.rejectionReason ?? "problematic") : null;

      const report = await prisma.report.update({
        where: { id: params.id },
        data: {
          ...(body.status != null && {
            status: body.status,
            rejectionReason: rejectionReason ?? undefined,
            reviewedBy: auth.type === "user" ? auth.session.user.id : undefined,
            reviewedAt: new Date(),
          }),
        },
        include: { person: true, user: { select: { id: true } } },
      });

      if (body.status === "accepted" || body.status === "rejected") {
        const { getSettingNumber, SETTING_KEYS } = await import("../lib/settings");
        if (body.status === "accepted") {
          const reward = await getSettingNumber(SETTING_KEYS.TOKENS_REWARD_APPROVED_REPORT);
          await prisma.user.update({
            where: { id: existing.userId },
            data: { tokenBalance: { increment: reward } },
          });
        } else if (rejectionReason === "false" || rejectionReason === "problematic") {
          const key =
            rejectionReason === "false"
              ? SETTING_KEYS.TOKENS_DEDUCT_FALSE_REPORT
              : SETTING_KEYS.TOKENS_DEDUCT_PROBLEMATIC_REPORT;
          const deduct = await getSettingNumber(key);
          const newBalance = Math.max(0, (existing.user.tokenBalance ?? 0) - deduct);
          await prisma.user.update({
            where: { id: existing.userId },
            data: { tokenBalance: newBalance },
          });
        }
      }

      await createAuditLog({
        action:
          body.status === "accepted" ? "approve" : body.status === "rejected" ? "reject" : "update",
        entity: "Report",
        entityId: report.id,
        details: JSON.stringify({ status: body.status, rejectionReason }),
        ctx: getAuditCtx(auth, { ip, userAgent: request.headers.get("user-agent") ?? undefined }),
      });
      return report;
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({
        status: t.Optional(t.String()),
        rejectionReason: t.Optional(t.Union([t.Literal("false"), t.Literal("problematic")])),
      }),
    },
  )
  // IP whitelist
  .get("/ip-whitelist", async () => {
    const data = await prisma.adminPanelIpWhitelist.findMany({
      orderBy: { createdAt: "desc" },
    });
    return { data };
  })
  .post(
    "/ip-whitelist",
    async ({ body, request, ip, auth }) => {
      const row = await prisma.adminPanelIpWhitelist.create({
        data: { ipAddress: body.ipAddress },
      });
      await createAuditLog({
        action: "create",
        entity: "AdminPanelIpWhitelist",
        entityId: row.id,
        details: JSON.stringify({ ipAddress: body.ipAddress }),
        ctx: getAuditCtx(auth, { ip, userAgent: request.headers.get("user-agent") ?? undefined }),
      });
      return row;
    },
    { body: t.Object({ ipAddress: t.String() }) },
  )
  .delete(
    "/ip-whitelist/:id",
    async ({ params, request, ip, auth }) => {
      await prisma.adminPanelIpWhitelist.delete({ where: { id: params.id } });
      await createAuditLog({
        action: "delete",
        entity: "AdminPanelIpWhitelist",
        entityId: params.id,
        ctx: getAuditCtx(auth, { ip, userAgent: request.headers.get("user-agent") ?? undefined }),
      });
      return { success: true };
    },
    { params: t.Object({ id: t.String() }) },
  )
  // Invitations (creates 8-char InviteCode, one-time use)
  .post(
    "/invitations",
    async ({ body, request, ip, auth }) => {
      const { ensureUniqueInviteCode } = await import("./invite");
      const firstAdmin = await prisma.admin.findFirst();
      const inviterId = firstAdmin?.userId;
      if (!inviterId) throw new Error("No admin user found to create invitations");
      const code = await ensureUniqueInviteCode();
      const invite = await prisma.inviteCode.create({
        data: {
          code,
          inviterId,
          invitedEmail: body.email ?? null,
        },
      });
      await createAuditLog({
        action: "create",
        entity: "InviteCode",
        entityId: invite.id,
        details: JSON.stringify({ code: invite.code, email: invite.invitedEmail }),
        ctx: getAuditCtx(auth, { ip, userAgent: request.headers.get("user-agent") ?? undefined }),
      });
      const baseURL =
        process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      return {
        ...invite,
        inviteLink: `${baseURL}/register?code=${code}`,
      };
    },
    {
      body: t.Object(
        {
          email: t.Optional(t.String()),
          name: t.Optional(t.String()),
          expiresInDays: t.Optional(t.Number()),
        },
        { additionalProperties: true },
      ),
    },
  )
  // Admin panel users
  .get("/ip-whitelist", async () => {
    const data = await prisma.adminPanelIpWhitelist.findMany({
      orderBy: { createdAt: "desc" },
    });
    return { data };
  })
  .post(
    "/ip-whitelist",
    async ({ body, request, ip, auth }) => {
      const row = await prisma.adminPanelIpWhitelist.create({
        data: { ipAddress: body.ipAddress },
      });
      await createAuditLog({
        action: "create",
        entity: "AdminPanelIpWhitelist",
        entityId: row.id,
        details: JSON.stringify({ ipAddress: row.ipAddress }),
        ctx: getAuditCtx(auth, { ip, userAgent: request.headers.get("user-agent") ?? undefined }),
      });
      return row;
    },
    { body: t.Object({ ipAddress: t.String() }) },
  )
  .delete(
    "/ip-whitelist/:id",
    async ({ params, request, ip, auth }) => {
      await prisma.adminPanelIpWhitelist.delete({ where: { id: params.id } });
      await createAuditLog({
        action: "delete",
        entity: "AdminPanelIpWhitelist",
        entityId: params.id,
        ctx: getAuditCtx(auth, { ip, userAgent: request.headers.get("user-agent") ?? undefined }),
      });
      return { success: true };
    },
    { params: t.Object({ id: t.String() }) },
  )
  // Panel users
  .get("/panel-users", async () => {
    const data = await prisma.adminPanelUser.findMany({
      select: { id: true, username: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
    return { data };
  })
  .post(
    "/panel-users",
    async ({ body, request, ip, auth }) => {
      const { auth: authLib } = await import("@/lib/auth");
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
        ctx: getAuditCtx(auth, { ip, userAgent: request.headers.get("user-agent") ?? undefined }),
      });
      return { id: user.id, username: user.username, createdAt: user.createdAt };
    },
    {
      body: t.Object({
        username: t.String(),
        password: t.String({ minLength: 8 }),
      }),
    },
  )
  // IP whitelist
  .get("/ip-whitelist", async () => {
    const data = await prisma.adminPanelIpWhitelist.findMany({ orderBy: { createdAt: "desc" } });
    return { data };
  })
  .post(
    "/ip-whitelist",
    async ({ body, request, ip, auth }) => {
      const row = await prisma.adminPanelIpWhitelist.create({
        data: { ipAddress: body.ipAddress },
      });
      await createAuditLog({
        action: "create",
        entity: "AdminPanelIpWhitelist",
        entityId: row.id,
        details: JSON.stringify({ ipAddress: row.ipAddress }),
        ctx: getAuditCtx(auth, { ip, userAgent: request.headers.get("user-agent") ?? undefined }),
      });
      return row;
    },
    { body: t.Object({ ipAddress: t.String() }) },
  )
  .delete(
    "/ip-whitelist/:id",
    async ({ params, request, ip, auth }) => {
      await prisma.adminPanelIpWhitelist.delete({ where: { id: params.id } });
      await createAuditLog({
        action: "delete",
        entity: "AdminPanelIpWhitelist",
        entityId: params.id,
        ctx: getAuditCtx(auth, { ip, userAgent: request.headers.get("user-agent") ?? undefined }),
      });
      return { success: true };
    },
    { params: t.Object({ id: t.String() }) },
  )
  // IP whitelist (admin panel access)
  .get("/ip-whitelist", async () => {
    const data = await prisma.adminPanelIpWhitelist.findMany({
      orderBy: { createdAt: "desc" },
    });
    return { data };
  })
  .post(
    "/ip-whitelist",
    async ({ body, request, ip, auth }) => {
      const row = await prisma.adminPanelIpWhitelist.create({
        data: { ipAddress: body.ipAddress },
      });
      await createAuditLog({
        action: "create",
        entity: "AdminPanelIpWhitelist",
        entityId: row.id,
        details: JSON.stringify({ ipAddress: row.ipAddress }),
        ctx: getAuditCtx(auth, { ip, userAgent: request.headers.get("user-agent") ?? undefined }),
      });
      return row;
    },
    { body: t.Object({ ipAddress: t.String() }) },
  )
  .delete(
    "/ip-whitelist/:id",
    async ({ params, request, ip, auth }) => {
      await prisma.adminPanelIpWhitelist.delete({ where: { id: params.id } });
      await createAuditLog({
        action: "delete",
        entity: "AdminPanelIpWhitelist",
        entityId: params.id,
        ctx: getAuditCtx(auth, { ip, userAgent: request.headers.get("user-agent") ?? undefined }),
      });
      return { success: true };
    },
    { params: t.Object({ id: t.String() }) },
  )
  // Admin panel - IP whitelist
  .get("/ip-whitelist", async () => {
    const data = await prisma.adminPanelIpWhitelist.findMany({
      orderBy: { createdAt: "desc" },
    });
    return { data };
  })
  .post(
    "/ip-whitelist",
    async ({ body, request, ip, auth }) => {
      const row = await prisma.adminPanelIpWhitelist.create({
        data: { ipAddress: body.ipAddress },
      });
      await createAuditLog({
        action: "create",
        entity: "AdminPanelIpWhitelist",
        entityId: row.id,
        details: JSON.stringify({ ipAddress: row.ipAddress }),
        ctx: getAuditCtx(auth, { ip, userAgent: request.headers.get("user-agent") ?? undefined }),
      });
      return row;
    },
    { body: t.Object({ ipAddress: t.String() }) },
  )
  .delete(
    "/ip-whitelist/:id",
    async ({ params, request, ip, auth }) => {
      await prisma.adminPanelIpWhitelist.delete({ where: { id: params.id } });
      await createAuditLog({
        action: "delete",
        entity: "AdminPanelIpWhitelist",
        entityId: params.id,
        ctx: getAuditCtx(auth, { ip, userAgent: request.headers.get("user-agent") ?? undefined }),
      });
      return { success: true };
    },
    { params: t.Object({ id: t.String() }) },
  )
  // Admin panel users
  .get("/panel-users", async () => {
    const data = await prisma.adminPanelUser.findMany({
      select: { id: true, username: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
    return { data };
  })
  .post(
    "/panel-users",
    async ({ body, request, ip, auth }) => {
      const { auth: authLib } = await import("@/lib/auth");
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
        ctx: getAuditCtx(auth, { ip, userAgent: request.headers.get("user-agent") ?? undefined }),
      });
      return { id: user.id, username: user.username, createdAt: user.createdAt };
    },
    { body: t.Object({ username: t.String(), password: t.String() }) },
  )
  // IP whitelist (admin panel)
  .get("/ip-whitelist", async () => {
    const data = await prisma.adminPanelIpWhitelist.findMany({ orderBy: { createdAt: "desc" } });
    return { data };
  })
  .post(
    "/ip-whitelist",
    async ({ body, request, ip, auth }) => {
      const row = await prisma.adminPanelIpWhitelist.create({
        data: { ipAddress: body.ipAddress },
      });
      await createAuditLog({
        action: "create",
        entity: "AdminPanelIpWhitelist",
        entityId: row.id,
        details: JSON.stringify({ ipAddress: row.ipAddress }),
        ctx: getAuditCtx(auth, { ip, userAgent: request.headers.get("user-agent") ?? undefined }),
      });
      return row;
    },
    { body: t.Object({ ipAddress: t.String() }) },
  )
  .delete(
    "/ip-whitelist/:id",
    async ({ params, request, ip, auth }) => {
      await prisma.adminPanelIpWhitelist.delete({ where: { id: params.id } });
      await createAuditLog({
        action: "delete",
        entity: "AdminPanelIpWhitelist",
        entityId: params.id,
        ctx: getAuditCtx(auth, { ip, userAgent: request.headers.get("user-agent") ?? undefined }),
      });
      return { success: true };
    },
    { params: t.Object({ id: t.String() }) },
  )
  // Audit logs
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
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "desc" },
        skip,
        take: perPage,
      }),
      prisma.auditLog.count({ where }),
    ]);
    return { data, total, page, perPage };
  });
