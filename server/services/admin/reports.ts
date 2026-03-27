import { Elysia, t } from "elysia";
import { prisma } from "../../db";
import { createAuditLog } from "../audit";
import { getAuditCtx, mapReportDocuments } from "./shared";

export const adminReportsRoutes = new Elysia({ name: "adminReports" })
  .get("/reports/pending-count", async () => {
    const count = await prisma.report.count({ where: { status: "pending" } });
    return { count };
  })
  .get("/reports/queue", async ({ query }) => {
    const page = Number(query.page ?? 1);
    const perPage = Math.min(Number(query.perPage ?? 25), 100);
    const skip = (page - 1) * perPage;
    const { getSettingNumber, SETTING_KEYS } = await import("../../lib/settings");
    const consensusMin = await getSettingNumber(SETTING_KEYS.REPORT_CONSENSUS_MIN_REVIEWS);
    const queueWhere = {
      status: { in: ["pending", "accepted", "rejected"] },
    };
    const [data, total] = await Promise.all([
      prisma.report.findMany({
        where: queueWhere,
        include: {
          person: true,
          user: { select: { id: true, name: true, username: true } },
          assignedToUser: { select: { id: true, name: true, username: true } },
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
  })
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
