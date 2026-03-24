import { Elysia, t } from "elysia";
import { prisma } from "../../db";
import { createAuditLog } from "../audit";
import { getAuditCtx } from "./shared";

export const adminCategoriesRoutes = new Elysia({ name: "adminCategories" })
  .get("/categories", async () => {
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
        ctx: getAuditCtx(auth, {
          ip,
          userAgent: request.headers.get("user-agent") ?? undefined,
        }),
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
        ctx: getAuditCtx(auth, {
          ip,
          userAgent: request.headers.get("user-agent") ?? undefined,
        }),
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
        ctx: getAuditCtx(auth, {
          ip,
          userAgent: request.headers.get("user-agent") ?? undefined,
        }),
      });
      return { success: true };
    },
    { params: t.Object({ id: t.String() }) },
  );
