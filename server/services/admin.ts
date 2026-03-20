import { Elysia, t } from "elysia";
import { prisma } from "../db";
import { getAllSettings, setSettings, SETTING_KEYS, type SettingsMap } from "../lib/settings";
import { documentToServeUrl } from "./upload";
import { createAuditLog } from "./audit";
import { auth as authLib } from "@/lib/auth";
import { getAdminPanelSession } from "./admin-panel-auth";

function mapReportDocuments<T extends { documents?: { id: string; name: string; url: string }[] }>(
  r: T,
): T {
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

function getAuditCtx(
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
  .get("/me", () => ({ ok: true }))
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
        max_invite_codes_unused: t.Optional(t.Number()),
        min_approved_reports_for_approval: t.Optional(t.Number()),
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
        ctx: getAuditCtx(auth, { ip, userAgent: request.headers.get("user-agent") ?? undefined }),
      });
      return user;
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({ role: t.Union([t.Literal("user"), t.Literal("validator")]) }),
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
  )
  // People - /people/pending must come before /people (so "pending" is not captured as :id)
  .get(
    "/people/pending",
    async ({ query }) => {
      const where: { status: "pending"; OR?: unknown[] } = { status: "pending" };
      const s = query.search?.trim();
      if (s) {
        const searchPattern = `%${s}%`;
        where.OR = [
          { firstName: { contains: searchPattern } },
          { lastName: { contains: searchPattern } },
          { fatherName: { contains: searchPattern } },
          { nationalCode: { contains: searchPattern } },
        ];
      }
      const data = await prisma.person.findMany({
        where,
        orderBy: [{ createdAt: "desc" }],
        take: query.limit ? Number(query.limit) : 100,
      });
      return { data };
    },
    { query: t.Object({ search: t.Optional(t.String()), limit: t.Optional(t.String()) }) },
  )
  .get("/people", async ({ query }) => {
    const where: Record<string, unknown> = {};
    if (query.pending !== "true") {
      where.status = "approved";
    }
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
          fatherName: body.fatherName,
          nationalCode: body.nationalCode,
          imageUrl: body.imageUrl,
          title: body.title,
          organization: body.organization,
          dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : undefined,
          address: body.address,
          mobile: body.mobile,
          phone: body.phone,
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
        fatherName: t.Optional(t.String()),
        nationalCode: t.Optional(t.String()),
        imageUrl: t.Optional(t.String()),
        title: t.Optional(t.String()),
        organization: t.Optional(t.String()),
        dateOfBirth: t.Optional(t.String()),
        address: t.Optional(t.String()),
        mobile: t.Optional(t.String()),
        phone: t.Optional(t.String()),
        isFamous: t.Optional(t.Boolean()),
      }),
    },
  )
  .put(
    "/people/:id/approve",
    async ({ params, request, ip, auth }) => {
      const person = await prisma.person.update({
        where: { id: params.id },
        data: { status: "approved" },
      });
      await createAuditLog({
        action: "approve",
        entity: "Person",
        entityId: person.id,
        details: JSON.stringify({ status: "approved" }),
        ctx: getAuditCtx(auth, { ip, userAgent: request.headers.get("user-agent") ?? undefined }),
      });
      return person;
    },
    { params: t.Object({ id: t.String() }) },
  )
  .put(
    "/people/:id/reject",
    async ({ params, request, ip, auth }) => {
      await prisma.person.delete({ where: { id: params.id } });
      await createAuditLog({
        action: "reject",
        entity: "Person",
        entityId: params.id,
        details: "pending person rejected and deleted",
        ctx: getAuditCtx(auth, { ip, userAgent: request.headers.get("user-agent") ?? undefined }),
      });
      return { success: true };
    },
    { params: t.Object({ id: t.String() }) },
  )
  .post(
    "/people/:id/merge",
    async ({ params, body, request, ip, auth }) => {
      const pending = await prisma.person.findUnique({ where: { id: params.id } });
      if (!pending || pending.status !== "pending") throw new Error("Pending person not found");
      const target = await prisma.person.findUnique({ where: { id: body.targetPersonId } });
      if (!target || target.status !== "approved") throw new Error("Target person not found");

      await prisma.report.updateMany({
        where: { personId: params.id },
        data: { personId: body.targetPersonId },
      });

      const merged = await prisma.person.update({
        where: { id: body.targetPersonId },
        data: {
          ...(body.firstName != null && { firstName: body.firstName }),
          ...(body.lastName != null && { lastName: body.lastName }),
          ...(body.fatherName != null && { fatherName: body.fatherName }),
          ...(body.nationalCode != null && { nationalCode: body.nationalCode }),
          ...(body.imageUrl != null && { imageUrl: body.imageUrl }),
          ...(body.title != null && { title: body.title }),
          ...(body.organization != null && { organization: body.organization }),
          ...(body.dateOfBirth != null && { dateOfBirth: new Date(body.dateOfBirth) }),
          ...(body.address != null && { address: body.address }),
          ...(body.mobile != null && { mobile: body.mobile }),
          ...(body.phone != null && { phone: body.phone }),
        },
      });
      await prisma.person.delete({ where: { id: params.id } });
      await createAuditLog({
        action: "merge",
        entity: "Person",
        entityId: target.id,
        details: JSON.stringify({
          mergedFrom: params.id,
          mergedInto: body.targetPersonId,
          data: body,
        }),
        ctx: getAuditCtx(auth, { ip, userAgent: request.headers.get("user-agent") ?? undefined }),
      });
      return merged;
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({
        targetPersonId: t.String(),
        firstName: t.Optional(t.String()),
        lastName: t.Optional(t.String()),
        fatherName: t.Optional(t.String()),
        nationalCode: t.Optional(t.String()),
        imageUrl: t.Optional(t.String()),
        title: t.Optional(t.String()),
        organization: t.Optional(t.String()),
        dateOfBirth: t.Optional(t.String()),
        address: t.Optional(t.String()),
        mobile: t.Optional(t.String()),
        phone: t.Optional(t.String()),
      }),
    },
  )
  .put(
    "/people/:id/approve",
    async ({ params, request, ip, auth }) => {
      const p = await prisma.person.findUnique({ where: { id: params.id } });
      if (!p || p.status !== "pending") throw new Error("Not found or not pending");
      const person = await prisma.person.update({
        where: { id: params.id },
        data: { status: "approved" },
      });
      await createAuditLog({
        action: "approve",
        entity: "Person",
        entityId: person.id,
        details: JSON.stringify({ firstName: person.firstName, lastName: person.lastName }),
        ctx: getAuditCtx(auth, { ip, userAgent: request.headers.get("user-agent") ?? undefined }),
      });
      return person;
    },
    { params: t.Object({ id: t.String() }) },
  )
  .put(
    "/people/:id/reject",
    async ({ params, request, ip, auth }) => {
      const p = await prisma.person.findUnique({ where: { id: params.id } });
      if (!p || p.status !== "pending") throw new Error("Not found or not pending");
      await prisma.person.delete({ where: { id: params.id } });
      await createAuditLog({
        action: "reject",
        entity: "Person",
        entityId: params.id,
        details: JSON.stringify({ firstName: p.firstName, lastName: p.lastName }),
        ctx: getAuditCtx(auth, { ip, userAgent: request.headers.get("user-agent") ?? undefined }),
      });
      return { success: true };
    },
    { params: t.Object({ id: t.String() }) },
  )
  .post(
    "/people/:id/merge",
    async ({ params, body, request, ip, auth }) => {
      const pending = await prisma.person.findUnique({ where: { id: params.id } });
      if (!pending || pending.status !== "pending") throw new Error("Not found or not pending");
      const target = await prisma.person.findUnique({ where: { id: body.targetPersonId } });
      if (!target || target.status !== "approved") throw new Error("Target person not found");

      const merged = {
        firstName: body.firstName ?? target.firstName,
        lastName: body.lastName ?? target.lastName,
        fatherName: body.fatherName ?? target.fatherName ?? undefined,
        nationalCode: body.nationalCode ?? target.nationalCode ?? undefined,
        imageUrl: body.imageUrl ?? target.imageUrl ?? undefined,
        title: body.title ?? target.title ?? undefined,
        organization: body.organization ?? target.organization ?? undefined,
        dateOfBirth:
          body.dateOfBirth != null ? new Date(body.dateOfBirth) : (target.dateOfBirth ?? undefined),
        address: body.address ?? target.address ?? undefined,
        mobile: body.mobile ?? target.mobile ?? undefined,
        phone: body.phone ?? target.phone ?? undefined,
      };

      await prisma.$transaction(async (tx) => {
        await tx.report.updateMany({
          where: { personId: params.id },
          data: { personId: body.targetPersonId },
        });
        await tx.person.update({
          where: { id: body.targetPersonId },
          data: merged,
        });
        await tx.person.delete({ where: { id: params.id } });
      });

      await createAuditLog({
        action: "merge",
        entity: "Person",
        entityId: body.targetPersonId,
        details: JSON.stringify({
          mergedFrom: params.id,
          pendingName: `${pending.firstName} ${pending.lastName}`,
        }),
        ctx: getAuditCtx(auth, { ip, userAgent: request.headers.get("user-agent") ?? undefined }),
      });

      return prisma.person.findUnique({ where: { id: body.targetPersonId } });
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({
        targetPersonId: t.String(),
        firstName: t.Optional(t.String()),
        lastName: t.Optional(t.String()),
        fatherName: t.Optional(t.String()),
        nationalCode: t.Optional(t.String()),
        imageUrl: t.Optional(t.String()),
        title: t.Optional(t.String()),
        organization: t.Optional(t.String()),
        dateOfBirth: t.Optional(t.String()),
        address: t.Optional(t.String()),
        mobile: t.Optional(t.String()),
        phone: t.Optional(t.String()),
      }),
    },
  )
  .put(
    "/people/:id/approve",
    async ({ params, request, ip, auth }) => {
      const p = await prisma.person.findUnique({ where: { id: params.id } });
      if (!p || p.status !== "pending") throw new Error("Not found or not pending");
      const person = await prisma.person.update({
        where: { id: params.id },
        data: { status: "approved" },
      });
      await createAuditLog({
        action: "approve",
        entity: "Person",
        entityId: person.id,
        details: JSON.stringify({ firstName: person.firstName, lastName: person.lastName }),
        ctx: getAuditCtx(auth, { ip, userAgent: request.headers.get("user-agent") ?? undefined }),
      });
      return person;
    },
    { params: t.Object({ id: t.String() }) },
  )
  .put(
    "/people/:id/reject",
    async ({ params, request, ip, auth }) => {
      const p = await prisma.person.findUnique({ where: { id: params.id } });
      if (!p || p.status !== "pending") throw new Error("Not found or not pending");
      await prisma.person.delete({ where: { id: params.id } });
      await createAuditLog({
        action: "reject",
        entity: "Person",
        entityId: params.id,
        details: JSON.stringify({ firstName: p.firstName, lastName: p.lastName }),
        ctx: getAuditCtx(auth, { ip, userAgent: request.headers.get("user-agent") ?? undefined }),
      });
      return { success: true };
    },
    { params: t.Object({ id: t.String() }) },
  )
  .post(
    "/people/:id/merge",
    async ({ params, body, request, ip, auth }) => {
      const pending = await prisma.person.findUnique({ where: { id: params.id } });
      if (!pending || pending.status !== "pending") throw new Error("Not found or not pending");
      const target = await prisma.person.findUnique({ where: { id: body.targetPersonId } });
      if (!target || target.status !== "approved")
        throw new Error("Target person not found or not approved");

      const merged = {
        firstName: body.firstName ?? target.firstName,
        lastName: body.lastName ?? target.lastName,
        fatherName: body.fatherName ?? target.fatherName ?? undefined,
        nationalCode: body.nationalCode ?? target.nationalCode ?? undefined,
        imageUrl: body.imageUrl ?? target.imageUrl ?? undefined,
        title: body.title ?? target.title ?? undefined,
        organization: body.organization ?? target.organization ?? undefined,
        dateOfBirth: body.dateOfBirth
          ? new Date(body.dateOfBirth)
          : (target.dateOfBirth ?? undefined),
        address: body.address ?? target.address ?? undefined,
        mobile: body.mobile ?? target.mobile ?? undefined,
        phone: body.phone ?? target.phone ?? undefined,
      };

      await prisma.$transaction([
        prisma.person.update({ where: { id: target.id }, data: merged }),
        prisma.report.updateMany({
          where: { personId: pending.id },
          data: { personId: target.id },
        }),
        prisma.person.delete({ where: { id: pending.id } }),
      ]);

      const updated = await prisma.person.findUnique({ where: { id: target.id } });
      await createAuditLog({
        action: "merge",
        entity: "Person",
        entityId: target.id,
        details: JSON.stringify({ mergedFrom: pending.id, merged }),
        ctx: getAuditCtx(auth, { ip, userAgent: request.headers.get("user-agent") ?? undefined }),
      });
      return updated!;
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({
        targetPersonId: t.String(),
        firstName: t.Optional(t.String()),
        lastName: t.Optional(t.String()),
        fatherName: t.Optional(t.String()),
        nationalCode: t.Optional(t.String()),
        imageUrl: t.Optional(t.String()),
        title: t.Optional(t.String()),
        organization: t.Optional(t.String()),
        dateOfBirth: t.Optional(t.String()),
        address: t.Optional(t.String()),
        mobile: t.Optional(t.String()),
        phone: t.Optional(t.String()),
      }),
    },
  )
  .put(
    "/people/:id/approve",
    async ({ params, request, ip, auth }) => {
      const p = await prisma.person.findUnique({ where: { id: params.id } });
      if (!p || p.status !== "pending") throw new Error("Not found or not pending");
      const person = await prisma.person.update({
        where: { id: params.id },
        data: { status: "approved" },
      });
      await createAuditLog({
        action: "approve",
        entity: "Person",
        entityId: person.id,
        details: JSON.stringify({ firstName: person.firstName, lastName: person.lastName }),
        ctx: getAuditCtx(auth, { ip, userAgent: request.headers.get("user-agent") ?? undefined }),
      });
      return person;
    },
    { params: t.Object({ id: t.String() }) },
  )
  .put(
    "/people/:id/reject",
    async ({ params, request, ip, auth }) => {
      const p = await prisma.person.findUnique({ where: { id: params.id } });
      if (!p || p.status !== "pending") throw new Error("Not found or not pending");
      await prisma.person.delete({ where: { id: params.id } });
      await createAuditLog({
        action: "reject",
        entity: "Person",
        entityId: params.id,
        details: JSON.stringify({ firstName: p.firstName, lastName: p.lastName }),
        ctx: getAuditCtx(auth, { ip, userAgent: request.headers.get("user-agent") ?? undefined }),
      });
      return { success: true };
    },
    { params: t.Object({ id: t.String() }) },
  )
  .post(
    "/people/:id/merge",
    async ({ params, body, request, ip, auth }) => {
      const pending = await prisma.person.findUnique({ where: { id: params.id } });
      if (!pending || pending.status !== "pending") throw new Error("Not found or not pending");
      const target = await prisma.person.findUnique({ where: { id: body.targetPersonId } });
      if (!target || target.status !== "approved")
        throw new Error("Target person not found or not approved");
      const merged = await prisma.person.update({
        where: { id: body.targetPersonId },
        data: {
          ...(body.firstName != null && { firstName: body.firstName }),
          ...(body.lastName != null && { lastName: body.lastName }),
          ...(body.fatherName != null && { fatherName: body.fatherName }),
          ...(body.nationalCode != null && { nationalCode: body.nationalCode }),
          ...(body.imageUrl != null && { imageUrl: body.imageUrl }),
          ...(body.title != null && { title: body.title }),
          ...(body.organization != null && { organization: body.organization }),
          ...(body.dateOfBirth != null && { dateOfBirth: new Date(body.dateOfBirth) }),
          ...(body.address != null && { address: body.address }),
          ...(body.mobile != null && { mobile: body.mobile }),
          ...(body.phone != null && { phone: body.phone }),
        },
      });
      await prisma.report.updateMany({
        where: { personId: params.id },
        data: { personId: body.targetPersonId },
      });
      await prisma.person.delete({ where: { id: params.id } });
      await createAuditLog({
        action: "merge",
        entity: "Person",
        entityId: params.id,
        details: JSON.stringify({ into: body.targetPersonId, merged: body }),
        ctx: getAuditCtx(auth, { ip, userAgent: request.headers.get("user-agent") ?? undefined }),
      });
      return merged;
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({
        targetPersonId: t.String(),
        firstName: t.Optional(t.String()),
        lastName: t.Optional(t.String()),
        fatherName: t.Optional(t.String()),
        nationalCode: t.Optional(t.String()),
        imageUrl: t.Optional(t.String()),
        title: t.Optional(t.String()),
        organization: t.Optional(t.String()),
        dateOfBirth: t.Optional(t.String()),
        address: t.Optional(t.String()),
        mobile: t.Optional(t.String()),
        phone: t.Optional(t.String()),
      }),
    },
  )
  .put(
    "/people/:id/approve",
    async ({ params, request, ip, auth }) => {
      const p = await prisma.person.findUnique({ where: { id: params.id } });
      if (!p) throw new Error("Not found");
      if (p.status !== "pending") throw new Error("Person is not pending");
      const person = await prisma.person.update({
        where: { id: params.id },
        data: { status: "approved" },
      });
      await createAuditLog({
        action: "approve",
        entity: "Person",
        entityId: person.id,
        details: JSON.stringify({ firstName: person.firstName, lastName: person.lastName }),
        ctx: getAuditCtx(auth, { ip, userAgent: request.headers.get("user-agent") ?? undefined }),
      });
      return person;
    },
    { params: t.Object({ id: t.String() }) },
  )
  .put(
    "/people/:id/reject",
    async ({ params, request, ip, auth }) => {
      const p = await prisma.person.findUnique({ where: { id: params.id } });
      if (!p) throw new Error("Not found");
      if (p.status !== "pending") throw new Error("Person is not pending");
      await prisma.person.delete({ where: { id: params.id } });
      await createAuditLog({
        action: "reject",
        entity: "Person",
        entityId: params.id,
        details: JSON.stringify({ firstName: p.firstName, lastName: p.lastName }),
        ctx: getAuditCtx(auth, { ip, userAgent: request.headers.get("user-agent") ?? undefined }),
      });
      return { success: true };
    },
    { params: t.Object({ id: t.String() }) },
  )
  .post(
    "/people/:id/merge",
    async ({ params, body, request, ip, auth }) => {
      const pending = await prisma.person.findUnique({ where: { id: params.id } });
      if (!pending) throw new Error("Pending person not found");
      if (pending.status !== "pending") throw new Error("Person is not pending");
      const target = await prisma.person.findUnique({ where: { id: body.targetPersonId } });
      if (!target) throw new Error("Target person not found");
      if (target.status !== "approved") throw new Error("Target must be approved");
      const merged = { ...target, ...body.mergedData } as typeof target;
      await prisma.report.updateMany({
        where: { personId: params.id },
        data: { personId: body.targetPersonId },
      });
      await prisma.person.update({
        where: { id: body.targetPersonId },
        data: {
          firstName: merged.firstName,
          lastName: merged.lastName,
          fatherName: merged.fatherName ?? undefined,
          nationalCode: merged.nationalCode ?? undefined,
          imageUrl: merged.imageUrl ?? undefined,
          title: merged.title ?? undefined,
          organization: merged.organization ?? undefined,
          dateOfBirth: merged.dateOfBirth ?? undefined,
          address: merged.address ?? undefined,
          mobile: merged.mobile ?? undefined,
          phone: merged.phone ?? undefined,
          isFamous: merged.isFamous,
        },
      });
      await prisma.person.delete({ where: { id: params.id } });
      await createAuditLog({
        action: "merge",
        entity: "Person",
        entityId: params.id,
        details: JSON.stringify({
          into: body.targetPersonId,
          mergedData: body.mergedData,
        }),
        ctx: getAuditCtx(auth, { ip, userAgent: request.headers.get("user-agent") ?? undefined }),
      });
      return { success: true };
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({
        targetPersonId: t.String(),
        mergedData: t.Record(t.String(), t.Union([t.String(), t.Null(), t.Number(), t.Boolean()])),
      }),
    },
  )
  .put(
    "/people/:id/approve",
    async ({ params, request, ip, auth }) => {
      const p = await prisma.person.findUnique({ where: { id: params.id } });
      if (!p) throw new Error("Not found");
      if (p.status !== "pending") throw new Error("Person is not pending");
      const person = await prisma.person.update({
        where: { id: params.id },
        data: { status: "approved" },
      });
      await createAuditLog({
        action: "approve",
        entity: "Person",
        entityId: person.id,
        details: JSON.stringify({ firstName: person.firstName, lastName: person.lastName }),
        ctx: getAuditCtx(auth, { ip, userAgent: request.headers.get("user-agent") ?? undefined }),
      });
      return person;
    },
    { params: t.Object({ id: t.String() }) },
  )
  .put(
    "/people/:id/reject",
    async ({ params, request, ip, auth }) => {
      const p = await prisma.person.findUnique({ where: { id: params.id } });
      if (!p) throw new Error("Not found");
      if (p.status !== "pending") throw new Error("Person is not pending");
      const reportCount = await prisma.report.count({ where: { personId: params.id } });
      if (reportCount > 0)
        throw new Error("Cannot reject: این شخص در گزارش‌ها استفاده شده. از مرج استفاده کنید.");
      await prisma.person.delete({ where: { id: params.id } });
      await createAuditLog({
        action: "reject",
        entity: "Person",
        entityId: params.id,
        details: JSON.stringify({ firstName: p.firstName, lastName: p.lastName }),
        ctx: getAuditCtx(auth, { ip, userAgent: request.headers.get("user-agent") ?? undefined }),
      });
      return { success: true };
    },
    { params: t.Object({ id: t.String() }) },
  )
  .post(
    "/people/:id/merge",
    async ({ params, body, request, ip, auth }) => {
      const pending = await prisma.person.findUnique({ where: { id: params.id } });
      if (!pending) throw new Error("Not found");
      if (pending.status !== "pending") throw new Error("Person is not pending");
      const target = await prisma.person.findUnique({ where: { id: body.targetPersonId } });
      if (!target) throw new Error("Target person not found");
      if (target.status !== "approved") throw new Error("Target must be approved");
      if (target.id === pending.id) throw new Error("Cannot merge with self");
      const merged = {
        firstName: body.firstName ?? target.firstName,
        lastName: body.lastName ?? target.lastName,
        fatherName: body.fatherName ?? target.fatherName ?? undefined,
        nationalCode: body.nationalCode ?? target.nationalCode ?? undefined,
        imageUrl: body.imageUrl ?? target.imageUrl ?? undefined,
        title: body.title ?? target.title ?? undefined,
        organization: body.organization ?? target.organization ?? undefined,
        dateOfBirth: body.dateOfBirth
          ? new Date(body.dateOfBirth)
          : (target.dateOfBirth ?? undefined),
        address: body.address ?? target.address ?? undefined,
        mobile: body.mobile ?? target.mobile ?? undefined,
        phone: body.phone ?? target.phone ?? undefined,
      };
      const [updated] = await prisma.$transaction([
        prisma.person.update({
          where: { id: target.id },
          data: merged,
        }),
        prisma.report.updateMany({
          where: { personId: pending.id },
          data: { personId: target.id },
        }),
        prisma.person.delete({ where: { id: pending.id } }),
      ]);
      await createAuditLog({
        action: "merge",
        entity: "Person",
        entityId: target.id,
        details: JSON.stringify({
          pendingId: pending.id,
          targetId: target.id,
          merged,
        }),
        ctx: getAuditCtx(auth, { ip, userAgent: request.headers.get("user-agent") ?? undefined }),
      });
      return updated;
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({
        targetPersonId: t.String(),
        firstName: t.Optional(t.String()),
        lastName: t.Optional(t.String()),
        fatherName: t.Optional(t.String()),
        nationalCode: t.Optional(t.String()),
        imageUrl: t.Optional(t.String()),
        title: t.Optional(t.String()),
        organization: t.Optional(t.String()),
        dateOfBirth: t.Optional(t.String()),
        address: t.Optional(t.String()),
        mobile: t.Optional(t.String()),
        phone: t.Optional(t.String()),
      }),
    },
  )
  .put(
    "/people/:id/approve",
    async ({ params, request, ip, auth }) => {
      const person = await prisma.person.update({
        where: { id: params.id },
        data: { status: "approved" },
      });
      await createAuditLog({
        action: "approve",
        entity: "Person",
        entityId: person.id,
        details: JSON.stringify({ status: "approved" }),
        ctx: getAuditCtx(auth, { ip, userAgent: request.headers.get("user-agent") ?? undefined }),
      });
      return person;
    },
    { params: t.Object({ id: t.String() }) },
  )
  .put(
    "/people/:id/reject",
    async ({ params, request, ip, auth }) => {
      await prisma.person.delete({ where: { id: params.id } });
      await createAuditLog({
        action: "reject",
        entity: "Person",
        entityId: params.id,
        details: "pending person rejected",
        ctx: getAuditCtx(auth, { ip, userAgent: request.headers.get("user-agent") ?? undefined }),
      });
      return { success: true };
    },
    { params: t.Object({ id: t.String() }) },
  )
  .post(
    "/people/:id/merge",
    async ({ params, body, request, ip, auth }) => {
      const pending = await prisma.person.findUnique({ where: { id: params.id } });
      if (!pending || pending.status !== "pending") throw new Error("Pending person not found");
      const target = await prisma.person.findUnique({ where: { id: body.targetPersonId } });
      if (!target) throw new Error("Target person not found");
      if (target.status !== "approved") throw new Error("Target must be approved");
      const update: Record<string, unknown> = {
        firstName: body.firstName ?? target.firstName,
        lastName: body.lastName ?? target.lastName,
        fatherName: body.fatherName ?? target.fatherName ?? undefined,
        nationalCode: body.nationalCode ?? target.nationalCode ?? undefined,
        title: body.title ?? target.title ?? undefined,
        organization: body.organization ?? target.organization ?? undefined,
        dateOfBirth: body.dateOfBirth
          ? new Date(body.dateOfBirth)
          : (target.dateOfBirth ?? undefined),
        address: body.address ?? target.address ?? undefined,
        mobile: body.mobile ?? target.mobile ?? undefined,
        phone: body.phone ?? target.phone ?? undefined,
        imageUrl: body.imageUrl ?? target.imageUrl ?? undefined,
      };
      const merged = await prisma.person.update({
        where: { id: target.id },
        data: update,
      });
      await prisma.report.updateMany({
        where: { personId: pending.id },
        data: { personId: target.id },
      });
      await prisma.person.delete({ where: { id: pending.id } });
      await createAuditLog({
        action: "merge",
        entity: "Person",
        entityId: target.id,
        details: JSON.stringify({ mergedFrom: pending.id, mergedInto: target.id }),
        ctx: getAuditCtx(auth, { ip, userAgent: request.headers.get("user-agent") ?? undefined }),
      });
      return merged;
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({
        targetPersonId: t.String(),
        firstName: t.Optional(t.String()),
        lastName: t.Optional(t.String()),
        fatherName: t.Optional(t.String()),
        nationalCode: t.Optional(t.String()),
        title: t.Optional(t.String()),
        organization: t.Optional(t.String()),
        dateOfBirth: t.Optional(t.String()),
        address: t.Optional(t.String()),
        mobile: t.Optional(t.String()),
        phone: t.Optional(t.String()),
        imageUrl: t.Optional(t.String()),
      }),
    },
  )
  .put(
    "/people/:id/approve",
    async ({ params, request, ip, auth }) => {
      const pending = await prisma.person.findUnique({ where: { id: params.id } });
      if (!pending || pending.status !== "pending") throw new Error("Not found or not pending");
      const person = await prisma.person.update({
        where: { id: params.id },
        data: { status: "approved" },
      });
      await createAuditLog({
        action: "approve",
        entity: "Person",
        entityId: person.id,
        details: JSON.stringify({ firstName: person.firstName, lastName: person.lastName }),
        ctx: getAuditCtx(auth, { ip, userAgent: request.headers.get("user-agent") ?? undefined }),
      });
      return person;
    },
    { params: t.Object({ id: t.String() }) },
  )
  .put(
    "/people/:id/reject",
    async ({ params, request, ip, auth }) => {
      const pending = await prisma.person.findUnique({ where: { id: params.id } });
      if (!pending || pending.status !== "pending") throw new Error("Not found or not pending");
      await prisma.person.delete({ where: { id: params.id } });
      await createAuditLog({
        action: "reject",
        entity: "Person",
        entityId: params.id,
        details: JSON.stringify({ firstName: pending.firstName, lastName: pending.lastName }),
        ctx: getAuditCtx(auth, { ip, userAgent: request.headers.get("user-agent") ?? undefined }),
      });
      return { success: true };
    },
    { params: t.Object({ id: t.String() }) },
  )
  .post(
    "/people/:id/merge",
    async ({ params, body, request, ip, auth }) => {
      const pending = await prisma.person.findUnique({ where: { id: params.id } });
      if (!pending || pending.status !== "pending") throw new Error("Not found or not pending");
      const target = await prisma.person.findUnique({ where: { id: body.targetPersonId } });
      if (!target || target.status !== "approved")
        throw new Error("Target person not found or not approved");
      if (target.id === pending.id) throw new Error("Cannot merge person with itself");

      const merged = {
        ...(body.firstName != null && { firstName: body.firstName }),
        ...(body.lastName != null && { lastName: body.lastName }),
        ...(body.fatherName != null && { fatherName: body.fatherName }),
        ...(body.nationalCode != null && { nationalCode: body.nationalCode }),
        ...(body.imageUrl != null && { imageUrl: body.imageUrl }),
        ...(body.title != null && { title: body.title }),
        ...(body.organization != null && { organization: body.organization }),
        ...(body.dateOfBirth != null && { dateOfBirth: new Date(body.dateOfBirth) }),
        ...(body.address != null && { address: body.address }),
        ...(body.mobile != null && { mobile: body.mobile }),
        ...(body.phone != null && { phone: body.phone }),
      };

      await prisma.$transaction(async (tx) => {
        await tx.report.updateMany({
          where: { personId: pending.id },
          data: { personId: target.id },
        });
        await tx.person.update({ where: { id: target.id }, data: merged });
        await tx.person.delete({ where: { id: pending.id } });
      });

      const updated = await prisma.person.findUnique({ where: { id: target.id } });
      await createAuditLog({
        action: "merge",
        entity: "Person",
        entityId: target.id,
        details: JSON.stringify({ fromId: pending.id, merged }),
        ctx: getAuditCtx(auth, { ip, userAgent: request.headers.get("user-agent") ?? undefined }),
      });
      return updated;
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({
        targetPersonId: t.String(),
        firstName: t.Optional(t.String()),
        lastName: t.Optional(t.String()),
        fatherName: t.Optional(t.String()),
        nationalCode: t.Optional(t.String()),
        imageUrl: t.Optional(t.String()),
        title: t.Optional(t.String()),
        organization: t.Optional(t.String()),
        dateOfBirth: t.Optional(t.String()),
        address: t.Optional(t.String()),
        mobile: t.Optional(t.String()),
        phone: t.Optional(t.String()),
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
          ...(body.fatherName != null && { fatherName: body.fatherName }),
          ...(body.nationalCode != null && { nationalCode: body.nationalCode }),
          ...(body.imageUrl != null && { imageUrl: body.imageUrl }),
          ...(body.title != null && { title: body.title }),
          ...(body.organization != null && { organization: body.organization }),
          ...(body.dateOfBirth != null && { dateOfBirth: new Date(body.dateOfBirth) }),
          ...(body.address != null && { address: body.address }),
          ...(body.mobile != null && { mobile: body.mobile }),
          ...(body.phone != null && { phone: body.phone }),
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
        fatherName: t.Optional(t.String()),
        nationalCode: t.Optional(t.String()),
        imageUrl: t.Optional(t.String()),
        title: t.Optional(t.String()),
        organization: t.Optional(t.String()),
        dateOfBirth: t.Optional(t.String()),
        address: t.Optional(t.String()),
        mobile: t.Optional(t.String()),
        phone: t.Optional(t.String()),
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
  .get("/reports/pending-count", async () => {
    const count = await prisma.report.count({ where: { status: "pending" } });
    return { count };
  })
  .get("/reports/queue", async ({ query }) => {
    const page = Number(query.page ?? 1);
    const perPage = Math.min(Number(query.perPage ?? 25), 100);
    const skip = (page - 1) * perPage;
    const { getSettingNumber, SETTING_KEYS } = await import("../lib/settings");
    const minApproved = await getSettingNumber(SETTING_KEYS.MIN_APPROVED_REPORTS_FOR_APPROVAL);
    const [data, total] = await Promise.all([
      prisma.report.findMany({
        where: { status: "pending" },
        include: {
          person: true,
          user: { select: { id: true, name: true, username: true } },
          reviews: { orderBy: { createdAt: "desc" } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: perPage,
      }),
      prisma.report.count({ where: { status: "pending" } }),
    ]);
    return {
      data: data.map((r) => {
        const accepted = r.reviews.filter((rev) => rev.action === "accepted").length;
        const rejected = r.reviews.filter((rev) => rev.action === "rejected").length;
        return mapReportDocuments({
          ...r,
          acceptedCount: accepted,
          rejectedCount: rejected,
          inProgressCount: Math.max(0, minApproved - accepted - rejected),
        });
      }),
      total,
      page,
      perPage,
      minApproved,
    };
  })
  .get(
    "/reports/:id",
    async ({ params }) => {
      const report = await prisma.report.findUnique({
        where: { id: params.id },
        include: {
          person: true,
          user: { select: { id: true, name: true, username: true } },
          category: true,
          subcategory: true,
          documents: true,
          reviews: { orderBy: { createdAt: "desc" } },
        },
      });
      if (!report) throw new Error("Not found");
      return mapReportDocuments(report);
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
        include: { person: true, user: { select: { id: true, name: true, username: true } } },
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
        await prisma.reportReview.create({
          data: {
            reportId: report.id,
            reviewerId: auth.type === "user" ? auth.session.user.id : undefined,
            action: body.status,
            rejectionReason:
              body.status === "rejected" ? (rejectionReason ?? undefined) : undefined,
          },
        });
      }

      if (body.status === "accepted" || body.status === "rejected") {
        const { getSettingNumber, SETTING_KEYS } = await import("../lib/settings");
        const { addTokenTransaction, TOKEN_TRANSACTION_TYPES } =
          await import("../lib/token-transaction");
        if (body.status === "accepted") {
          const reward = await getSettingNumber(SETTING_KEYS.TOKENS_REWARD_APPROVED_REPORT);
          await addTokenTransaction(
            existing.userId,
            reward,
            TOKEN_TRANSACTION_TYPES.report_approved,
            report.id,
          );
        } else if (rejectionReason === "false" || rejectionReason === "problematic") {
          const key =
            rejectionReason === "false"
              ? SETTING_KEYS.TOKENS_DEDUCT_FALSE_REPORT
              : SETTING_KEYS.TOKENS_DEDUCT_PROBLEMATIC_REPORT;
          const deduct = await getSettingNumber(key);
          const txType =
            rejectionReason === "false"
              ? TOKEN_TRANSACTION_TYPES.report_false
              : TOKEN_TRANSACTION_TYPES.report_problematic;
          await addTokenTransaction(existing.userId, -deduct, txType, report.id);
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
          invitedUsername: body.username?.trim() ? body.username.trim().toLowerCase() : null,
        },
      });
      await createAuditLog({
        action: "create",
        entity: "InviteCode",
        entityId: invite.id,
        details: JSON.stringify({ code: invite.code, invitedUsername: invite.invitedUsername }),
        ctx: getAuditCtx(auth, { ip, userAgent: request.headers.get("user-agent") ?? undefined }),
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
        include: { user: { select: { id: true, name: true, username: true } } },
        orderBy: { createdAt: "desc" },
        skip,
        take: perPage,
      }),
      prisma.auditLog.count({ where }),
    ]);
    return { data, total, page, perPage };
  });
