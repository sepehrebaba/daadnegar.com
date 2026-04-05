import { Elysia, t } from "elysia";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "../../db";
import { createAuditLog } from "../audit";
import { adminGuard, getAuditCtx } from "./shared";

// /people/pending must come before /people (so "pending" is not captured as :id)
export const adminPeopleRoutes = new Elysia({ name: "adminPeople" })
  .use(adminGuard)
  .get(
    "/people/pending",
    async ({ query }) => {
      const where: Prisma.PersonWhereInput = {
        status: "pending",
      };
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
    {
      query: t.Object({
        search: t.Optional(t.String()),
        limit: t.Optional(t.String()),
      }),
    },
  )
  .get("/people", async ({ query }) => {
    const where: Prisma.PersonWhereInput = {};
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
        details: JSON.stringify({
          firstName: person.firstName,
          lastName: person.lastName,
        }),
        ctx: getAuditCtx(auth, {
          ip,
          userAgent: request.headers.get("user-agent") ?? undefined,
        }),
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
      const pending = await prisma.person.findUnique({
        where: { id: params.id },
      });
      if (!pending || pending.status !== "pending") throw new Error("Not found or not pending");
      const person = await prisma.person.update({
        where: { id: params.id },
        data: { status: "approved" },
      });
      await createAuditLog({
        action: "approve",
        entity: "Person",
        entityId: person.id,
        details: JSON.stringify({
          firstName: person.firstName,
          lastName: person.lastName,
        }),
        ctx: getAuditCtx(auth, {
          ip,
          userAgent: request.headers.get("user-agent") ?? undefined,
        }),
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
      const reportCount = await prisma.report.count({
        where: { personId: params.id },
      });
      if (reportCount > 0)
        throw new Error("Cannot reject: این شخص در گزارش‌ها استفاده شده. از مرج استفاده کنید.");
      await prisma.person.delete({ where: { id: params.id } });
      await createAuditLog({
        action: "reject",
        entity: "Person",
        entityId: params.id,
        details: JSON.stringify({
          firstName: p.firstName,
          lastName: p.lastName,
        }),
        ctx: getAuditCtx(auth, {
          ip,
          userAgent: request.headers.get("user-agent") ?? undefined,
        }),
      });
      return { success: true };
    },
    { params: t.Object({ id: t.String() }) },
  )
  .post(
    "/people/:id/merge",
    async ({ params, body, request, ip, auth }) => {
      const pending = await prisma.person.findUnique({
        where: { id: params.id },
      });
      if (!pending || pending.status !== "pending") throw new Error("Not found or not pending");
      const target = await prisma.person.findUnique({
        where: { id: body.targetPersonId },
      });
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
        ...(body.dateOfBirth != null && {
          dateOfBirth: new Date(body.dateOfBirth),
        }),
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

      const updated = await prisma.person.findUnique({
        where: { id: target.id },
      });
      await createAuditLog({
        action: "merge",
        entity: "Person",
        entityId: target.id,
        details: JSON.stringify({ fromId: pending.id, merged }),
        ctx: getAuditCtx(auth, {
          ip,
          userAgent: request.headers.get("user-agent") ?? undefined,
        }),
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
          ...(body.dateOfBirth != null && {
            dateOfBirth: new Date(body.dateOfBirth),
          }),
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
        ctx: getAuditCtx(auth, {
          ip,
          userAgent: request.headers.get("user-agent") ?? undefined,
        }),
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
        ctx: getAuditCtx(auth, {
          ip,
          userAgent: request.headers.get("user-agent") ?? undefined,
        }),
      });
      return { success: true };
    },
    { params: t.Object({ id: t.String() }) },
  );
