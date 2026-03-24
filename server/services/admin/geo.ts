import { Elysia, t } from "elysia";
import { prisma } from "../../db";
import { createAuditLog } from "../audit";
import { getAuditCtx } from "./shared";

export const adminGeoRoutes = new Elysia({ name: "adminGeo" })
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
        ctx: getAuditCtx(auth, {
          ip,
          userAgent: request.headers.get("user-agent") ?? undefined,
        }),
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
        ctx: getAuditCtx(auth, {
          ip,
          userAgent: request.headers.get("user-agent") ?? undefined,
        }),
      });
      return province;
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({
        name: t.Optional(t.String()),
        sortOrder: t.Optional(t.Number()),
      }),
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
        ctx: getAuditCtx(auth, {
          ip,
          userAgent: request.headers.get("user-agent") ?? undefined,
        }),
      });
      return { success: true };
    },
    { params: t.Object({ id: t.String() }) },
  )
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
        details: JSON.stringify({
          name: city.name,
          provinceId: city.provinceId,
        }),
        ctx: getAuditCtx(auth, {
          ip,
          userAgent: request.headers.get("user-agent") ?? undefined,
        }),
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
        ctx: getAuditCtx(auth, {
          ip,
          userAgent: request.headers.get("user-agent") ?? undefined,
        }),
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
        ctx: getAuditCtx(auth, {
          ip,
          userAgent: request.headers.get("user-agent") ?? undefined,
        }),
      });
      return { success: true };
    },
    { params: t.Object({ id: t.String() }) },
  );
