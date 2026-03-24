import { Elysia, t } from "elysia";
import { prisma } from "../db";
import { createAuditLog } from "./audit";
import { auth } from "@/lib/auth";
import { publishReportSubmitted } from "@/lib/rabbitmq";
import { resolveInviteToken } from "../lib/auth-invite";
import { assertPasswordChangeNotRequired } from "../lib/must-change-password";
import { getSettingBool, getSettingNumber, SETTING_KEYS } from "../lib/settings";
import { documentToServeUrl } from "./upload";

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
            username: inviteUser.username,
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
    if (session?.user?.id) {
      await assertPasswordChangeNotRequired(session.user.id);
    }
    return { session };
  })
  .post(
    "/",
    async ({ body, request, ip, session }) => {
      if (!session?.user?.id) {
        throw new Error("Unauthorized");
      }
      const reportsEnabled = await getSettingBool(SETTING_KEYS.REPORTS_ENABLED);
      if (!reportsEnabled) {
        throw new Error("در حال حاضر امکان ثبت گزارش جدید وجود ندارد");
      }
      const reportCountBefore = await prisma.report.count({ where: { userId: session.user.id } });
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
        details: JSON.stringify({ personId: body.personId }),
        ctx: {
          userId: session.user.id,
          ipAddress: ip?.address,
          userAgent: request.headers.get("user-agent") ?? undefined,
        },
      });
      const enqueued = await publishReportSubmitted(report.id);
      if (!enqueued) {
        console.error("[reports] Failed to enqueue report for assignment (RabbitMQ may be down)");
      }
      const isInviteUser =
        reportCountBefore === 0 &&
        (await prisma.inviteSession.findFirst({ where: { userId: session.user.id } }));
      let tokensAwarded = 0;
      if (isInviteUser) {
        const reward = await getSettingNumber(SETTING_KEYS.TOKENS_REWARD_INVITED_ACTIVITY);
        const { addTokenTransaction, TOKEN_TRANSACTION_TYPES } =
          await import("../lib/token-transaction");
        await addTokenTransaction(
          session.user.id,
          reward,
          TOKEN_TRANSACTION_TYPES.invite_activity,
          report.id,
        );
        tokensAwarded = reward;
      }
      return { ...mapReportDocuments(report), tokensAwarded };
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
    return reports.map(mapReportDocuments);
  })
  .get("/pending", async ({ request, session }) => {
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }
    const admin = await prisma.admin.findUnique({
      where: { userId: session.user.id },
    });
    if (admin) {
      const reports = await prisma.report.findMany({
        where: { status: "pending" },
        include: { person: true, user: { select: { id: true, name: true, username: true } } },
        orderBy: { createdAt: "desc" },
      });
      return reports;
    }
    const [dbUser, approvedCount, minRequired] = await Promise.all([
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
      }),
      prisma.report.count({
        where: { userId: session.user.id, status: "accepted" },
      }),
      getSettingNumber(SETTING_KEYS.MIN_APPROVED_REPORTS_FOR_APPROVAL),
    ]);
    const canApprove = dbUser?.role === "validator" || approvedCount >= minRequired;
    if (!canApprove) {
      throw new Error("Forbidden: نیاز به نقش اعتبارسنج یا حداقل گزارش‌های تاییدشده");
    }
    const isValidator = dbUser?.role === "validator";
    const reports = await prisma.report.findMany({
      where: {
        status: "pending",
        ...(isValidator ? { assignedTo: session.user.id } : {}),
      },
      include: { person: true, user: { select: { id: true, name: true, username: true } } },
      orderBy: { createdAt: "desc" },
    });
    return reports;
  })
  .get(
    "/pending/:id",
    async ({ params, session, request }) => {
      if (!session?.user?.id) throw new Error("Unauthorized");
      const admin = await prisma.admin.findUnique({
        where: { userId: session.user.id },
      });
      const [report, dbUser, approvedCount, minRequired] = await Promise.all([
        prisma.report.findFirst({
          where: { id: params.id, status: "pending" },
          include: {
            person: true,
            user: { select: { id: true, name: true, username: true } },
            category: true,
            subcategory: true,
            documents: true,
          },
        }),
        prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } }),
        prisma.report.count({ where: { userId: session.user.id, status: "accepted" } }),
        getSettingNumber(SETTING_KEYS.MIN_APPROVED_REPORTS_FOR_APPROVAL),
      ]);
      if (!report) throw new Error("Not found");
      let canView = !!admin;
      if (!canView) {
        canView = dbUser?.role === "validator" || approvedCount >= minRequired;
        if (canView && dbUser?.role === "validator" && report.assignedTo !== session.user.id) {
          canView = false;
        }
      }
      if (!canView) throw new Error("Forbidden");
      return mapReportDocuments(report);
    },
    { params: t.Object({ id: t.String() }) },
  )
  .get(
    "/:id",
    async ({ params, session, request, ip }) => {
      if (!session?.user?.id) throw new Error("Unauthorized");
      const report = await prisma.report.findFirst({
        where: { id: params.id, userId: session.user.id },
        include: { person: true, documents: true },
      });
      if (!report) throw new Error("Not found");
      await createAuditLog({
        action: "view",
        entity: "Report",
        entityId: report.id,
        ctx: {
          userId: session.user.id,
          ipAddress: ip?.address,
          userAgent: request.headers.get("user-agent") ?? undefined,
        },
      });
      return mapReportDocuments(report);
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
      let canApprove = !!admin;
      let dbUser: { role: string | null } | null = null;
      if (!canApprove) {
        const [user, approvedCount, minRequired] = await Promise.all([
          prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } }),
          prisma.report.count({ where: { userId: session.user.id, status: "accepted" } }),
          getSettingNumber(SETTING_KEYS.MIN_APPROVED_REPORTS_FOR_APPROVAL),
        ]);
        dbUser = user;
        canApprove = dbUser?.role === "validator" || approvedCount >= minRequired;
      }
      if (!canApprove) {
        throw new Error("Forbidden: نیاز به نقش اعتبارسنج یا حداقل گزارش‌های تاییدشده");
      }

      const existing = await prisma.report.findUnique({
        where: { id: params.id },
        include: { user: { select: { id: true } } },
      });
      if (!existing || existing.status !== "pending")
        throw new Error("Not found or already reviewed");
      if (!admin && dbUser?.role === "validator" && existing.assignedTo !== session.user.id) {
        throw new Error("Forbidden: این گزارش به شما اختصاص داده نشده است");
      }

      const report = await prisma.$transaction(async (tx) => {
        const r = await tx.report.update({
          where: { id: params.id },
          data: { status: "accepted", reviewedBy: session.user.id, reviewedAt: new Date() },
          include: { person: true },
        });
        await tx.reportReview.create({
          data: {
            reportId: r.id,
            reviewerId: session.user.id,
            action: "accepted",
          },
        });
        return r;
      });

      const reward = await getSettingNumber(SETTING_KEYS.TOKENS_REWARD_APPROVED_REPORT);
      const { addTokenTransaction, TOKEN_TRANSACTION_TYPES } =
        await import("../lib/token-transaction");
      await addTokenTransaction(
        existing.userId,
        reward,
        TOKEN_TRANSACTION_TYPES.report_approved,
        report.id,
      );

      await createAuditLog({
        action: "approve",
        entity: "Report",
        entityId: report.id,
        ctx: {
          userId: session.user.id,
          ipAddress: ip?.address,
          userAgent: request.headers.get("user-agent") ?? undefined,
        },
      });
      return report;
    },
    { params: t.Object({ id: t.String() }) },
  )
  .put(
    "/:id/reject",
    async ({ params, body, request, ip, session }) => {
      if (!session?.user?.id) throw new Error("Unauthorized");
      const rejectionReason = body?.rejectionReason ?? "problematic";
      if (rejectionReason !== "false" && rejectionReason !== "problematic") {
        throw new Error("دلیل رد باید «نقص یا افشای اطلاعات» یا «گزارش اشتباه یا قصد تخریب» باشد");
      }
      const admin = await prisma.admin.findUnique({
        where: { userId: session.user.id },
      });
      let canApprove = !!admin;
      let dbUser: { role: string | null } | null = null;
      if (!canApprove) {
        const [user, approvedCount, minRequired] = await Promise.all([
          prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } }),
          prisma.report.count({ where: { userId: session.user.id, status: "accepted" } }),
          getSettingNumber(SETTING_KEYS.MIN_APPROVED_REPORTS_FOR_APPROVAL),
        ]);
        dbUser = user;
        canApprove = dbUser?.role === "validator" || approvedCount >= minRequired;
      }
      if (!canApprove) {
        throw new Error("Forbidden: نیاز به نقش اعتبارسنج یا حداقل گزارش‌های تاییدشده");
      }

      const existing = await prisma.report.findUnique({
        where: { id: params.id },
        include: { user: { select: { id: true } } },
      });
      if (!existing || existing.status !== "pending")
        throw new Error("Not found or already reviewed");
      if (!admin && dbUser?.role === "validator" && existing.assignedTo !== session.user.id) {
        throw new Error("Forbidden: این گزارش به شما اختصاص داده نشده است");
      }

      const report = await prisma.$transaction(async (tx) => {
        const r = await tx.report.update({
          where: { id: params.id },
          data: {
            status: "rejected",
            rejectionReason,
            reviewedBy: session.user.id,
            reviewedAt: new Date(),
          },
          include: { person: true },
        });
        await tx.reportReview.create({
          data: {
            reportId: r.id,
            reviewerId: session.user.id,
            action: "rejected",
            rejectionReason,
          },
        });
        return r;
      });

      const { getSettingNumber: gsn, SETTING_KEYS: SK } = await import("../lib/settings");
      const { addTokenTransaction, TOKEN_TRANSACTION_TYPES } =
        await import("../lib/token-transaction");
      const deduct =
        rejectionReason === "false"
          ? await gsn(SK.TOKENS_DEDUCT_FALSE_REPORT)
          : await gsn(SK.TOKENS_DEDUCT_PROBLEMATIC_REPORT);
      const txType =
        rejectionReason === "false"
          ? TOKEN_TRANSACTION_TYPES.report_false
          : TOKEN_TRANSACTION_TYPES.report_problematic;
      await addTokenTransaction(existing.userId, -deduct, txType, report.id);

      await createAuditLog({
        action: "reject",
        entity: "Report",
        entityId: report.id,
        details: JSON.stringify({ rejectionReason }),
        ctx: {
          userId: session.user.id,
          ipAddress: ip?.address,
          userAgent: request.headers.get("user-agent") ?? undefined,
        },
      });
      return report;
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({
        rejectionReason: t.Optional(t.Union([t.Literal("false"), t.Literal("problematic")])),
      }),
    },
  );
