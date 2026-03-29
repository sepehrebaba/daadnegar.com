import { Elysia, t } from "elysia";
import { prisma } from "../../db";
import { createAuditLog } from "../audit";
import { getAuditCtx, mapReportDocuments } from "./shared";
import { syncReportPrimaryAssignee } from "../../lib/report-validator-assignment";

export const adminReportsRoutes = new Elysia({ name: "adminReports" })
  .get("/reports/pending-count", async () => {
    const count = await prisma.report.count({ where: { status: "pending" } });
    return { count };
  })
  .get(
    "/reports/queue",
    async ({ query }) => {
      const page = Number(query.page ?? 1);
      const perPage = Math.min(Number(query.perPage ?? 25), 100);
      const skip = (page - 1) * perPage;
      const { getSettingNumber, SETTING_KEYS } = await import("../../lib/settings");
      const consensusMin = await getSettingNumber(SETTING_KEYS.REPORT_CONSENSUS_MIN_REVIEWS);
      const queueWhere: Record<string, unknown> = {
        status: { in: ["pending", "accepted", "rejected"] },
      };
      const status = query.status?.trim();
      if (status && status !== "all") {
        queueWhere.status = status;
      }
      const city = query.city?.trim();
      if (city) {
        queueWhere.city = { contains: city };
      }
      if (query.categoryId?.trim()) {
        queueWhere.categoryId = query.categoryId.trim();
      }
      const person = query.person?.trim();
      if (person) {
        queueWhere.person = {
          OR: [{ firstName: { contains: person } }, { lastName: { contains: person } }],
        };
      }
      if (query.isPublic === "true") {
        queueWhere.isPublic = true;
      } else if (query.isPublic === "false") {
        queueWhere.isPublic = false;
      }
      if (query.hasDocuments === "true") {
        queueWhere.documents = { some: {} };
      } else if (query.hasDocuments === "false") {
        queueWhere.documents = { none: {} };
      }
      if (query.wantsContact === "true") {
        queueWhere.wantsContact = true;
      } else if (query.wantsContact === "false") {
        queueWhere.wantsContact = false;
      }
      const fromRaw = query.occurrenceDateFrom?.trim();
      const toRaw = query.occurrenceDateTo?.trim();
      const fromDate = fromRaw ? new Date(fromRaw) : null;
      const toDate = toRaw ? new Date(toRaw) : null;
      const occurrenceDateWhere: { gte?: Date; lte?: Date } = {};
      if (fromDate && !Number.isNaN(fromDate.getTime())) {
        fromDate.setHours(0, 0, 0, 0);
        occurrenceDateWhere.gte = fromDate;
      }
      if (toDate && !Number.isNaN(toDate.getTime())) {
        toDate.setHours(23, 59, 59, 999);
        occurrenceDateWhere.lte = toDate;
      }
      if (occurrenceDateWhere.gte || occurrenceDateWhere.lte) {
        queueWhere.occurrenceDate = occurrenceDateWhere;
      }
      const [data, total] = await Promise.all([
        prisma.report.findMany({
          where: queueWhere,
          include: {
            person: true,
            user: { select: { id: true, name: true, username: true } },
            assignedToUser: { select: { id: true, name: true, username: true } },
            category: { select: { id: true, name: true } },
            documents: { select: { id: true, name: true, url: true } },
            reviews: { orderBy: { createdAt: "desc" } },
            validatorAssignments: {
              orderBy: { assignedAt: "asc" },
              include: {
                validator: { select: { id: true, name: true, username: true } },
              },
            },
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: perPage,
        }),
        prisma.report.count({ where: queueWhere }),
      ]);
      return {
        data: data.map((r) => {
          const validatorReviews = r.reviews.filter((rev) => rev.reviewerId != null);
          const accepted = validatorReviews.filter((rev) => rev.action === "accepted").length;
          const rejected = validatorReviews.filter((rev) => rev.action === "rejected").length;
          return mapReportDocuments({
            ...r,
            acceptedCount: accepted,
            rejectedCount: rejected,
            inProgressCount: Math.max(0, consensusMin - accepted - rejected),
          });
        }),
        total,
        page,
        perPage,
        minApproved: consensusMin,
      };
    },
    {
      query: t.Object({
        page: t.Optional(t.String()),
        perPage: t.Optional(t.String()),
        status: t.Optional(
          t.Union([
            t.Literal("all"),
            t.Literal("pending"),
            t.Literal("accepted"),
            t.Literal("rejected"),
          ]),
        ),
        city: t.Optional(t.String()),
        categoryId: t.Optional(t.String()),
        person: t.Optional(t.String()),
        isPublic: t.Optional(t.Union([t.Literal("true"), t.Literal("false")])),
        hasDocuments: t.Optional(t.Union([t.Literal("true"), t.Literal("false")])),
        wantsContact: t.Optional(t.Union([t.Literal("true"), t.Literal("false")])),
        occurrenceDateFrom: t.Optional(t.String()),
        occurrenceDateTo: t.Optional(t.String()),
      }),
    },
  )
  .get(
    "/reports/:id",
    async ({ params }) => {
      const report = await prisma.report.findUnique({
        where: { id: params.id },
        include: {
          person: true,
          user: { select: { id: true, name: true, username: true } },
          assignedToUser: { select: { id: true, name: true, username: true } },
          category: true,
          subcategory: true,
          documents: true,
          reviews: { orderBy: { createdAt: "desc" } },
          validatorAssignments: {
            orderBy: { assignedAt: "asc" },
            include: {
              validator: { select: { id: true, name: true, username: true } },
            },
          },
        },
      });
      if (!report) throw new Error("Not found");
      const reviewerIds = [
        ...new Set(
          report.reviews
            .map((r) => r.reviewerId)
            .filter((id): id is string => id != null && id !== ""),
        ),
      ];
      const reviewerUsers =
        reviewerIds.length > 0
          ? await prisma.user.findMany({
              where: { id: { in: reviewerIds } },
              select: { id: true, name: true, username: true },
            })
          : [];
      const reviewerById = new Map(reviewerUsers.map((u) => [u.id, u]));
      const withReviewers = {
        ...report,
        reviews: report.reviews.map((rev) => ({
          ...rev,
          reviewer: rev.reviewerId ? (reviewerById.get(rev.reviewerId) ?? null) : null,
        })),
      };
      return mapReportDocuments(withReviewers);
    },
    { params: t.Object({ id: t.String() }) },
  )
  .put(
    "/reports/:id/publicity",
    async ({ params, body, request, ip, auth }) => {
      const existing = await prisma.report.findUnique({
        where: { id: params.id },
        select: { id: true, status: true },
      });
      if (!existing) throw new Error("Not found");
      if (existing.status === "deleted") {
        throw new Error("امکان تغییر عمومیت برای گزارش حذف‌شده وجود ندارد");
      }

      await prisma.report.update({
        where: { id: existing.id },
        data: { isPublic: body.isPublic },
      });
      await createAuditLog({
        action: body.isPublic ? "publish" : "unpublish",
        entity: "Report",
        entityId: existing.id,
        details: JSON.stringify({ isPublic: body.isPublic }),
        ctx: getAuditCtx(auth, {
          ip,
          userAgent: request.headers.get("user-agent") ?? undefined,
        }),
      });
      return { ok: true, id: existing.id, isPublic: body.isPublic };
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({ isPublic: t.Boolean() }),
    },
  )
  .post(
    "/reports/:id/redistribute-unaccepted",
    async ({ params, request, ip, auth }) => {
      const report = await prisma.report.findUnique({
        where: { id: params.id },
        select: { id: true, status: true },
      });
      if (!report) throw new Error("Not found");
      if (report.status !== "pending") {
        throw new Error("توزیع مجدد فقط برای گزارش‌های در انتظار بررسی فعال است");
      }

      const activeAssignments = await prisma.reportValidatorAssignment.findMany({
        where: { reportId: report.id, replacedAt: null },
        orderBy: { assignedAt: "asc" },
        include: {
          validator: { select: { id: true, name: true, username: true } },
        },
      });

      const unaccepted = activeAssignments.filter((a) => a.acceptedAt == null);
      if (unaccepted.length === 0) {
        return {
          ok: true,
          reportId: report.id,
          replacedCount: 0,
          notAcceptedCount: 0,
          message: "هیچ اعتبارسنجِ قبول‌نشده‌ای برای توزیع مجدد وجود ندارد",
        };
      }

      const [allValidators, assignmentRows, reviewRows] = await Promise.all([
        prisma.user.findMany({
          where: { role: "validator" },
          select: { id: true, name: true, username: true },
          orderBy: { id: "asc" },
        }),
        prisma.reportValidatorAssignment.findMany({
          where: { reportId: report.id },
          select: { validatorId: true },
        }),
        prisma.reportReview.findMany({
          where: { reportId: report.id, reviewerId: { not: null } },
          select: { reviewerId: true },
        }),
      ]);

      const excluded = new Set<string>(assignmentRows.map((r) => r.validatorId));
      for (const row of reviewRows) {
        if (row.reviewerId) excluded.add(row.reviewerId);
      }
      const availableValidators = allValidators.filter((v) => !excluded.has(v.id));
      const replaceCount = Math.min(unaccepted.length, availableValidators.length);
      if (replaceCount === 0) {
        return {
          ok: true,
          reportId: report.id,
          replacedCount: 0,
          notAcceptedCount: unaccepted.length,
          message: "اعتبارسنج جایگزین جدیدی در دسترس نیست",
        };
      }

      const targets = unaccepted.slice(0, replaceCount);
      const picked = availableValidators.slice(0, replaceCount);
      const now = new Date();

      await prisma.$transaction([
        ...targets.map((slot) =>
          prisma.reportValidatorAssignment.update({
            where: { id: slot.id },
            data: { replacedAt: now },
          }),
        ),
        ...picked.map((validator) =>
          prisma.reportValidatorAssignment.create({
            data: {
              reportId: report.id,
              validatorId: validator.id,
              assignedAt: now,
              reason: "stale_reassign",
            },
          }),
        ),
      ]);

      await syncReportPrimaryAssignee(report.id);
      await createAuditLog({
        action: "reassign",
        entity: "Report",
        entityId: report.id,
        details: JSON.stringify({
          replacedCount: replaceCount,
          oldValidatorIds: targets.map((slot) => slot.validatorId),
          newValidatorIds: picked.map((validator) => validator.id),
        }),
        ctx: getAuditCtx(auth, {
          ip,
          userAgent: request.headers.get("user-agent") ?? undefined,
        }),
      });

      return {
        ok: true,
        reportId: report.id,
        replacedCount: replaceCount,
        notAcceptedCount: unaccepted.length,
      };
    },
    { params: t.Object({ id: t.String() }) },
  )
  .delete(
    "/reports/:id",
    async ({ params, request, ip, auth }) => {
      const existing = await prisma.report.findUnique({
        where: { id: params.id },
        select: { id: true, status: true },
      });
      if (!existing) throw new Error("Not found");
      if (existing.status === "deleted") {
        return { ok: true, id: existing.id, status: existing.status };
      }

      const now = new Date();
      await prisma.$transaction([
        prisma.report.update({
          where: { id: existing.id },
          data: {
            status: "deleted",
            isPublic: false,
            reviewedAt: now,
            reviewedBy: auth.type === "user" ? auth.session.user.id : null,
          },
        }),
        prisma.reportValidatorAssignment.updateMany({
          where: { reportId: existing.id, replacedAt: null },
          data: { replacedAt: now },
        }),
      ]);
      await createAuditLog({
        action: "soft_delete",
        entity: "Report",
        entityId: existing.id,
        details: JSON.stringify({ fromStatus: existing.status, toStatus: "deleted" }),
        ctx: getAuditCtx(auth, {
          ip,
          userAgent: request.headers.get("user-agent") ?? undefined,
        }),
      });
      return { ok: true, id: existing.id, status: "deleted" };
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
        include: {
          person: true,
          user: { select: { id: true, name: true, username: true } },
        },
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
        const { getSettingNumber, SETTING_KEYS } = await import("../../lib/settings");
        const { addTokenTransaction, TOKEN_TRANSACTION_TYPES } =
          await import("../../lib/token-transaction");
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
        ctx: getAuditCtx(auth, {
          ip,
          userAgent: request.headers.get("user-agent") ?? undefined,
        }),
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
  );
