import { Elysia, t } from "elysia";
import { prisma } from "../db";
import { createAuditLog } from "./audit";
import { auth } from "@/lib/auth";
import { resolveInviteToken } from "../lib/auth-invite";

async function getSession(headers: Headers) {
  return auth.api.getSession({ headers });
}

export const reportsService = new Elysia({ prefix: "/reports", aot: false })
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
            role: "user",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          session: null,
        };
      }
    }
    return { session };
  })
  .post(
    "/",
    async ({ body, request, ip, session }) => {
      if (!session?.user?.id) {
        throw new Error("Unauthorized");
      }
      const report = await prisma.report.create({
        data: {
          userId: session.user.id,
          personId: body.personId,
          description: body.description,
          status: "pending",
          categoryId: body.categoryId ?? undefined,
          subcategoryId: body.subcategoryId ?? undefined,
          title: body.title ?? undefined,
          organizationType: body.organizationType ?? undefined,
          organizationName: body.organizationName ?? undefined,
          province: body.province ?? undefined,
          city: body.city ?? undefined,
          exactLocation: body.exactLocation ?? undefined,
          occurrenceFrequency: body.occurrenceFrequency ?? undefined,
          occurrenceDate: body.occurrenceDate ? new Date(body.occurrenceDate) : undefined,
          hasEvidence: body.hasEvidence ?? undefined,
          evidenceTypes: body.evidenceTypes ?? undefined,
          evidenceDescription: body.evidenceDescription ?? undefined,
          wantsContact: body.wantsContact ?? undefined,
          contactEmail: body.contactEmail ?? undefined,
          contactPhone: body.contactPhone ?? undefined,
          contactSocial: body.contactSocial ?? undefined,
          documents: {
            create: (body.documents ?? []).map((d: { name: string; url: string }) => ({
              name: d.name,
              url: d.url,
            })),
          },
        },
        include: { person: true, documents: true },
      });
      await createAuditLog({
        action: "create",
        entity: "Report",
        entityId: report.id,
        userId: session.user.id,
        details: JSON.stringify({ personId: body.personId }),
        ipAddress: ip?.address,
        userAgent: request.headers.get("user-agent") ?? undefined,
      });
      return report;
    },
    {
      body: t.Object({
        personId: t.String(),
        description: t.String({ minLength: 50 }),
        categoryId: t.Optional(t.String()),
        subcategoryId: t.Optional(t.String()),
        title: t.Optional(t.String()),
        organizationType: t.Optional(t.String()),
        organizationName: t.Optional(t.String()),
        province: t.Optional(t.String()),
        city: t.Optional(t.String()),
        exactLocation: t.Optional(t.String()),
        occurrenceFrequency: t.Optional(t.String()),
        occurrenceDate: t.Optional(t.String()),
        hasEvidence: t.Optional(t.Boolean()),
        evidenceTypes: t.Optional(t.String()),
        evidenceDescription: t.Optional(t.String()),
        wantsContact: t.Optional(t.Boolean()),
        contactEmail: t.Optional(t.String()),
        contactPhone: t.Optional(t.String()),
        contactSocial: t.Optional(t.String()),
        documents: t.Optional(t.Array(t.Object({ name: t.String(), url: t.String() }))),
      }),
    },
  )
  .get("/my", async ({ request, session }) => {
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }
    const reports = await prisma.report.findMany({
      where: { userId: session.user.id },
      include: { person: true, documents: true },
      orderBy: { createdAt: "desc" },
    });
    return reports;
  })
  .get("/pending", async ({ request, session }) => {
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }
    const admin = await prisma.admin.findUnique({
      where: { userId: session.user.id },
    });
    if (!admin) {
      throw new Error("Forbidden: Admin only");
    }
    const reports = await prisma.report.findMany({
      where: { status: "pending" },
      include: { person: true, user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    });
    return reports;
  })
  .get(
    "/:id",
    async ({ params, session }) => {
      if (!session?.user?.id) throw new Error("Unauthorized");
      const report = await prisma.report.findFirst({
        where: { id: params.id, userId: session.user.id },
        include: { person: true, documents: true },
      });
      if (!report) throw new Error("Not found");
      return report;
    },
    { params: t.Object({ id: t.String() }) },
  )
  .put(
    "/:id/approve",
    async ({ params, request, ip, session }) => {
      if (!session?.user?.id) throw new Error("Unauthorized");
      const admin = await prisma.admin.findUnique({
        where: { userId: session.user.id },
      });
      if (!admin) throw new Error("Forbidden: Admin only");

      const report = await prisma.report.update({
        where: { id: params.id },
        data: { status: "accepted", reviewedBy: session.user.id, reviewedAt: new Date() },
        include: { person: true },
      });
      await createAuditLog({
        action: "approve",
        entity: "Report",
        entityId: report.id,
        userId: session.user.id,
        ipAddress: ip?.address,
        userAgent: request.headers.get("user-agent") ?? undefined,
      });
      return report;
    },
    { params: t.Object({ id: t.String() }) },
  )
  .put(
    "/:id/reject",
    async ({ params, request, ip, session }) => {
      if (!session?.user?.id) throw new Error("Unauthorized");
      const admin = await prisma.admin.findUnique({
        where: { userId: session.user.id },
      });
      if (!admin) throw new Error("Forbidden: Admin only");

      const report = await prisma.report.update({
        where: { id: params.id },
        data: { status: "rejected", reviewedBy: session.user.id, reviewedAt: new Date() },
        include: { person: true },
      });
      await createAuditLog({
        action: "reject",
        entity: "Report",
        entityId: report.id,
        userId: session.user.id,
        ipAddress: ip?.address,
        userAgent: request.headers.get("user-agent") ?? undefined,
      });
      return report;
    },
    { params: t.Object({ id: t.String() }) },
  );
