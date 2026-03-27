import { Elysia, t } from "elysia";
import { prisma } from "../db";
import { createAuditLog } from "./audit";
import { auth } from "@/lib/auth";
import { publishReportSubmitted, publishReportTokenSettlement } from "@/lib/rabbitmq";
import { resolveInviteToken } from "../lib/auth-invite";
import { assertPasswordChangeNotRequired } from "../lib/must-change-password";
import {
  releaseValidatorSlotAfterReviewTx,
  topUpValidatorSlotsForReport,
  userMayVoteOnConsensusReport,
  validatorMayViewPendingReport,
  syncReportPrimaryAssignee,
} from "../lib/report-validator-assignment";
import { tryFinalizeConsensusReport } from "../lib/report-consensus-finalize";
import { processReportTokenSettlement } from "../lib/report-token-settlement";
import { isBadFaithCode, isGoodFaithCode } from "../lib/report-consensus-logic";
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

type ListReviewerStatusPayload =
  | { kind: "await_accept"; assignmentAssignedAt: string }
  | { kind: "await_vote"; acceptedAt: string | null }
  | { kind: "voted"; voteAction: "accepted" | "rejected" };

function reviewerListStatusForRow(
  vote: { action: string } | undefined,
  assignment: { acceptedAt: Date | null; assignedAt: Date } | undefined,
  role: string | null | undefined,
): ListReviewerStatusPayload {
  if (vote && (vote.action === "accepted" || vote.action === "rejected")) {
    return { kind: "voted", voteAction: vote.action };
  }
  if (role === "validator" && assignment && !assignment.acceptedAt) {
    return { kind: "await_accept", assignmentAssignedAt: assignment.assignedAt.toISOString() };
  }
  return { kind: "await_vote", acceptedAt: assignment?.acceptedAt?.toISOString() ?? null };
}

async function getSession(headers: Headers) {
  return auth.api.getSession({ headers });
}

const MIN_VALIDATOR_COMMENT_LEN = 10;

function requireValidatorComment(raw: string | undefined): string {
  const t = (raw ?? "").trim();
  if (t.length < MIN_VALIDATOR_COMMENT_LEN) {
    throw new Error(
      `شرح نظر شما باید حداقل ${MIN_VALIDATOR_COMMENT_LEN} نویسه باشد (تأیید و رد بدون نظر کافی نیست).`,
    );
  }
  return t;
}

function parseValidatorReject(body: {
  rejectionTier: "good_faith" | "bad_faith";
  rejectionCode: string;
  comment: string;
}) {
  const code = body.rejectionCode.trim().toUpperCase();
  const tier = body.rejectionTier;
  if (tier === "good_faith") {
    if (!isGoodFaithCode(code)) {
      throw new Error("کد رد با حسن‌نیت باید یکی از R1 تا R5 باشد");
    }
  } else if (!isBadFaithCode(code)) {
    throw new Error("کد رد با سوءنیت باید یکی از B1 تا B6 باشد");
  }
  const comment = requireValidatorComment(body.comment);
  return { tier, code, comment };
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
        ...(isValidator
          ? {
              OR: [
                {
                  validatorAssignments: {
                    some: { validatorId: session.user.id, replacedAt: null },
                  },
                },
                { assignedTo: session.user.id },
                {
                  reviews: { some: { reviewerId: session.user.id } },
                },
              ],
            }
          : {}),
      },
      include: { person: true, user: { select: { id: true, name: true, username: true } } },
      orderBy: { createdAt: "desc" },
    });
    const reportIds = reports.map((r) => r.id);
    if (reportIds.length === 0) return reports;
    const [myReviews, myAssignments] = await Promise.all([
      prisma.reportReview.findMany({
        where: { reportId: { in: reportIds }, reviewerId: session.user.id },
        select: { reportId: true, action: true },
      }),
      prisma.reportValidatorAssignment.findMany({
        where: {
          reportId: { in: reportIds },
          validatorId: session.user.id,
          replacedAt: null,
        },
        select: { reportId: true, acceptedAt: true, assignedAt: true },
      }),
    ]);
    const voteByReport = new Map(myReviews.map((v) => [v.reportId, v]));
    const assignByReport = new Map(myAssignments.map((a) => [a.reportId, a]));
    return reports.map((r) => ({
      ...r,
      listReviewerStatus: reviewerListStatusForRow(
        voteByReport.get(r.id),
        assignByReport.get(r.id),
        dbUser?.role,
      ),
    }));
  })
  .get("/pending/count", async ({ session }) => {
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }
    const admin = await prisma.admin.findUnique({
      where: { userId: session.user.id },
    });
    if (admin) {
      const count = await prisma.report.count({ where: { status: "pending" } });
      return { count };
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
    const count = await prisma.report.count({
      where: {
        status: "pending",
        ...(isValidator
          ? {
              OR: [
                {
                  validatorAssignments: {
                    some: { validatorId: session.user.id, replacedAt: null },
                  },
                },
                { assignedTo: session.user.id },
                {
                  reviews: { some: { reviewerId: session.user.id } },
                },
              ],
            }
          : {}),
      },
    });
    return { count };
  })
  .get(
    "/search",
    async ({ query, session }) => {
      if (!session?.user?.id) throw new Error("Unauthorized");
      const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
      });
      if (dbUser?.role !== "validator") {
        throw new Error("Forbidden: فقط اعتبارسنج به جستجو دسترسی دارد");
      }

      const page = Math.max(1, Number(query.page) || 1);
      const perPage = Math.min(50, Math.max(1, Number(query.perPage) || 20));
      const parseOptInt = (v: string | undefined) => {
        if (v == null || v === "") return undefined;
        const n = Number(v);
        return Number.isFinite(n) ? n : undefined;
      };

      const personQ = query.personQ?.trim() ?? "";
      const textQ = query.text?.trim() ?? "";
      const status =
        query.status === "pending" || query.status === "accepted" || query.status === "rejected"
          ? query.status
          : undefined;
      const createdFrom = query.createdFrom ? new Date(query.createdFrom) : undefined;
      const createdTo = query.createdTo ? new Date(query.createdTo) : undefined;
      const minReviews = parseOptInt(query.minReviews);
      const maxReviews = parseOptInt(query.maxReviews);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const andConditions: any[] = [];
      if (status) andConditions.push({ status });
      if (createdFrom && !Number.isNaN(createdFrom.getTime())) {
        andConditions.push({ createdAt: { gte: createdFrom } });
      }
      if (createdTo && !Number.isNaN(createdTo.getTime())) {
        const end = new Date(createdTo);
        end.setHours(23, 59, 59, 999);
        andConditions.push({ createdAt: { lte: end } });
      }
      if (personQ) {
        andConditions.push({
          person: {
            OR: [
              { firstName: { contains: personQ } },
              { lastName: { contains: personQ } },
              { nationalCode: { contains: personQ } },
            ],
          },
        });
      }
      if (textQ) {
        andConditions.push({
          OR: [{ description: { contains: textQ } }, { title: { contains: textQ } }],
        });
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let baseWhere: any = andConditions.length ? { AND: andConditions } : {};

      if (minReviews != null || maxReviews != null) {
        const groups = await prisma.reportReview.groupBy({
          by: ["reportId"],
          _count: { id: true },
        });
        const map = new Map(groups.map((g) => [g.reportId, g._count.id]));
        const minR = minReviews ?? 0;
        const maxR = maxReviews ?? Number.MAX_SAFE_INTEGER;
        const candidates = await prisma.report.findMany({
          where: baseWhere,
          select: { id: true },
        });
        const filteredIds = candidates
          .filter(({ id }) => {
            const n = map.get(id) ?? 0;
            return n >= minR && n <= maxR;
          })
          .map(({ id }) => id);
        baseWhere = { AND: [baseWhere, { id: { in: filteredIds } }] };
      }

      const skip = (page - 1) * perPage;
      const [total, rows] = await Promise.all([
        prisma.report.count({ where: baseWhere }),
        prisma.report.findMany({
          where: baseWhere,
          orderBy: { createdAt: "desc" },
          skip,
          take: perPage,
          include: {
            person: { select: { firstName: true, lastName: true, nationalCode: true } },
            user: { select: { id: true, name: true, username: true } },
            _count: { select: { reviews: true, validatorAssignments: true } },
          },
        }),
      ]);

      return {
        total,
        page,
        perPage,
        data: rows.map((r) => ({
          id: r.id,
          status: r.status,
          title: r.title,
          description: r.description,
          createdAt: r.createdAt.toISOString(),
          person: r.person,
          user: r.user,
          reviewCount: r._count.reviews,
          validatorAssignmentCount: r._count.validatorAssignments,
        })),
      };
    },
    {
      query: t.Object({
        page: t.Optional(t.String()),
        perPage: t.Optional(t.String()),
        personQ: t.Optional(t.String()),
        text: t.Optional(t.String()),
        status: t.Optional(t.String()),
        createdFrom: t.Optional(t.String()),
        createdTo: t.Optional(t.String()),
        minReviews: t.Optional(t.String()),
        maxReviews: t.Optional(t.String()),
      }),
    },
  )
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
        if (canView && dbUser?.role === "validator") {
          const allowed = await validatorMayViewPendingReport(
            report.id,
            session.user.id,
            report.assignedTo,
          );
          if (!allowed) canView = false;
        }
      }
      if (!canView) throw new Error("Forbidden");

      const [consensusMin, validatorReviews, myAssignment] = await Promise.all([
        getSettingNumber(SETTING_KEYS.REPORT_CONSENSUS_MIN_REVIEWS),
        prisma.reportReview.findMany({
          where: { reportId: report.id, reviewerId: { not: null } },
          select: { reviewerId: true, action: true, rejectionTier: true },
        }),
        prisma.reportValidatorAssignment.findFirst({
          where: {
            reportId: report.id,
            validatorId: session.user.id,
            replacedAt: null,
          },
          select: { acceptedAt: true },
        }),
      ]);
      const acceptedVotes = validatorReviews.filter((r) => r.action === "accepted").length;
      const badFaithRejectVotes = validatorReviews.filter(
        (r) => r.action === "rejected" && r.rejectionTier === "bad_faith",
      ).length;
      const goodFaithRejectVotes = validatorReviews.filter(
        (r) => r.action === "rejected" && r.rejectionTier !== "bad_faith",
      ).length;
      const rejectedVotes = goodFaithRejectVotes + badFaithRejectVotes;
      const myVote = validatorReviews.find((r) => r.reviewerId === session.user.id);

      return {
        ...mapReportDocuments(report),
        consensus: {
          minReviews: consensusMin,
          acceptedVotes,
          rejectedVotes,
          goodFaithRejectVotes,
          badFaithRejectVotes,
          validatorVotesTotal: validatorReviews.length,
          myReviewAction: myVote?.action ?? null,
          myRejectionTier: myVote?.rejectionTier ?? null,
          myAcceptedAt: myAssignment?.acceptedAt?.toISOString() ?? null,
        },
      };
    },
    { params: t.Object({ id: t.String() }) },
  )
  .get(
    "/:id",
    async ({ params, session, request, ip }) => {
      if (!session?.user?.id) throw new Error("Unauthorized");
      const [dbUser, report] = await Promise.all([
        prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } }),
        prisma.report.findFirst({
          where: { id: params.id },
          include: { person: true, documents: true },
        }),
      ]);
      if (!report) throw new Error("Not found");
      const isOwner = report.userId === session.user.id;
      const isValidator = dbUser?.role === "validator";
      if (!isOwner && !isValidator) throw new Error("Not found");
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
    "/:id/accept-review",
    async ({ params, session }) => {
      if (!session?.user?.id) throw new Error("Unauthorized");
      const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
      });
      if (dbUser?.role !== "validator") {
        throw new Error("Forbidden: فقط اعتبارسنج‌ها می‌توانند بررسی را بپذیرند");
      }

      const assignment = await prisma.reportValidatorAssignment.findFirst({
        where: {
          reportId: params.id,
          validatorId: session.user.id,
          replacedAt: null,
        },
      });
      if (!assignment) {
        throw new Error("این گزارش به شما اختصاص داده نشده است");
      }
      if (assignment.acceptedAt) {
        return { acceptedAt: assignment.acceptedAt };
      }

      const updated = await prisma.reportValidatorAssignment.update({
        where: { id: assignment.id },
        data: { acceptedAt: new Date() },
      });
      return { acceptedAt: updated.acceptedAt };
    },
    { params: t.Object({ id: t.String() }) },
  )
  .put(
    "/:id/approve",
    async ({ params, body, request, ip, session }) => {
      if (!session?.user?.id) throw new Error("Unauthorized");
      const admin = await prisma.admin.findUnique({
        where: { userId: session.user.id },
      });
      let canApprove = !!admin;
      let dbUser: { role: string | null } | null = null;
      if (!canApprove) {
        const [user, approvedCount, minRequired] = await Promise.all([
          prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } }),
          prisma.report.count({
            where: { userId: session.user.id, status: "accepted" },
          }),
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

      if (admin) {
        const report = await prisma.$transaction(async (tx) => {
          const r = await tx.report.update({
            where: { id: params.id },
            data: { status: "accepted", reviewedBy: session.user.id, reviewedAt: new Date() },
            include: { person: true },
          });
          const ac = (body?.comment ?? "").trim() || null;
          await tx.reportReview.create({
            data: {
              reportId: r.id,
              reviewerId: session.user.id,
              action: "accepted",
              reviewerComment: ac,
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
      }

      if (!dbUser) {
        dbUser = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { role: true },
        });
      }
      const mayVote = await userMayVoteOnConsensusReport(
        existing.id,
        session.user.id,
        dbUser?.role ?? null,
        existing.assignedTo,
      );
      if (!mayVote) {
        throw new Error("Forbidden: این گزارش به شما اختصاص داده نشده یا قبلاً رأی داده‌اید");
      }

      const approveComment = requireValidatorComment(body?.comment);

      await prisma.$transaction(async (tx) => {
        await tx.reportReview.create({
          data: {
            reportId: existing.id,
            reviewerId: session.user.id,
            action: "accepted",
            reviewerComment: approveComment,
          },
        });
        await releaseValidatorSlotAfterReviewTx(tx, existing.id, session.user.id);
      });

      await syncReportPrimaryAssignee(existing.id);
      await topUpValidatorSlotsForReport(existing.id);

      const { finalized } = await tryFinalizeConsensusReport(existing.id, session.user.id);

      if (finalized) {
        const published = await publishReportTokenSettlement(existing.id);
        if (!published) await processReportTokenSettlement(existing.id);
      }

      const report = await prisma.report.findUnique({
        where: { id: existing.id },
        include: { person: true },
      });
      if (!report) throw new Error("Not found");

      await createAuditLog({
        action: finalized ? "approve" : "validator_vote",
        entity: "Report",
        entityId: report.id,
        details: JSON.stringify({ phase: finalized ? "finalized" : "vote", vote: "accepted" }),
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
      body: t.Optional(
        t.Object({
          comment: t.Optional(t.String()),
        }),
      ),
    },
  )
  .put(
    "/:id/reject",
    async ({ params, body, request, ip, session }) => {
      if (!session?.user?.id) throw new Error("Unauthorized");
      const admin = await prisma.admin.findUnique({
        where: { userId: session.user.id },
      });
      const rejectionReasonAdmin = admin ? (body?.rejectionReason ?? "problematic") : null;
      if (admin) {
        if (rejectionReasonAdmin !== "false" && rejectionReasonAdmin !== "problematic") {
          throw new Error("دلیل رد باید «نقص یا افشای اطلاعات» یا «گزارش اشتباه یا قصد تخریب» باشد");
        }
      }
      let canApprove = !!admin;
      let dbUser: { role: string | null } | null = null;
      if (!canApprove) {
        const [user, approvedCount, minRequired] = await Promise.all([
          prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } }),
          prisma.report.count({
            where: { userId: session.user.id, status: "accepted" },
          }),
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

      if (admin) {
        const rr = rejectionReasonAdmin!;
        const adminRejectComment = (body?.comment ?? "").trim() || null;
        const report = await prisma.$transaction(async (tx) => {
          const r = await tx.report.update({
            where: { id: params.id },
            data: {
              status: "rejected",
              rejectionReason: rr,
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
              rejectionReason: rr,
              reviewerComment: adminRejectComment,
            },
          });
          return r;
        });
        const { getSettingNumber: gsn, SETTING_KEYS: SK } = await import("../lib/settings");
        const { addTokenTransaction, TOKEN_TRANSACTION_TYPES } =
          await import("../lib/token-transaction");
        const deduct =
          rr === "false"
            ? await gsn(SK.TOKENS_DEDUCT_FALSE_REPORT)
            : await gsn(SK.TOKENS_DEDUCT_PROBLEMATIC_REPORT);
        const txType =
          rr === "false"
            ? TOKEN_TRANSACTION_TYPES.report_false
            : TOKEN_TRANSACTION_TYPES.report_problematic;
        await addTokenTransaction(existing.userId, -deduct, txType, report.id);
        await createAuditLog({
          action: "reject",
          entity: "Report",
          entityId: report.id,
          details: JSON.stringify({ rejectionReason: rr }),
          ctx: {
            userId: session.user.id,
            ipAddress: ip?.address,
            userAgent: request.headers.get("user-agent") ?? undefined,
          },
        });
        return report;
      }

      if (!dbUser) {
        dbUser = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { role: true },
        });
      }
      const mayVote = await userMayVoteOnConsensusReport(
        existing.id,
        session.user.id,
        dbUser?.role ?? null,
        existing.assignedTo,
      );
      if (!mayVote) {
        throw new Error("Forbidden: این گزارش به شما اختصاص داده نشده یا قبلاً رأی داده‌اید");
      }

      if (body.rejectionTier !== "good_faith" && body.rejectionTier !== "bad_faith") {
        throw new Error(
          "برای رد باید نوع رد (حسن‌نیت یا سوءنیت)، کد دلیل و شرح نظر (حداقل ۱۰ نویسه) را ارسال کنید.",
        );
      }

      const parsedReject = parseValidatorReject({
        rejectionTier: body.rejectionTier,
        rejectionCode: body.rejectionCode ?? "",
        comment: body.comment ?? "",
      });

      await prisma.$transaction(async (tx) => {
        await tx.reportReview.create({
          data: {
            reportId: existing.id,
            reviewerId: session.user.id,
            action: "rejected",
            rejectionTier: parsedReject.tier,
            rejectionCode: parsedReject.code,
            reviewerComment: parsedReject.comment,
          },
        });
        await releaseValidatorSlotAfterReviewTx(tx, existing.id, session.user.id);
      });

      await syncReportPrimaryAssignee(existing.id);
      await topUpValidatorSlotsForReport(existing.id);

      const { finalized } = await tryFinalizeConsensusReport(existing.id, session.user.id);

      if (finalized) {
        const published = await publishReportTokenSettlement(existing.id);
        if (!published) await processReportTokenSettlement(existing.id);
      }

      const report = await prisma.report.findUnique({
        where: { id: existing.id },
        include: { person: true },
      });
      if (!report) throw new Error("Not found");

      await createAuditLog({
        action: finalized ? "reject" : "validator_vote",
        entity: "Report",
        entityId: report.id,
        details: JSON.stringify({
          phase: finalized ? "finalized" : "vote",
          vote: "rejected",
          rejectionTier: parsedReject.tier,
          rejectionCode: parsedReject.code,
        }),
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
        rejectionTier: t.Optional(t.Union([t.Literal("good_faith"), t.Literal("bad_faith")])),
        rejectionCode: t.Optional(t.String()),
        comment: t.Optional(t.String()),
      }),
    },
  );
