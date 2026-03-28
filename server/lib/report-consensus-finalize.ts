import { prisma } from "../db";
import { getSettingNumber, SETTING_KEYS } from "./settings";
import {
  pickOutcomeRejectionCode,
  resolveReporterOutcome,
  type VoteRow,
} from "./report-consensus-logic";

/**
 * If the report is still pending, has enough votes, and no settlement yet, creates final status and settlement row.
 */
export async function tryFinalizeConsensusReport(
  reportId: string,
  lastReviewerUserId: string,
): Promise<{ finalized: boolean }> {
  const minR = await getSettingNumber(SETTING_KEYS.REPORT_CONSENSUS_MIN_REVIEWS);

  return prisma.$transaction(async (tx) => {
    const rep = await tx.report.findUnique({
      where: { id: reportId },
      select: { status: true },
    });
    if (!rep || rep.status !== "pending") {
      return { finalized: false };
    }

    const existingSettlement = await tx.reportTokenSettlement.findUnique({
      where: { reportId },
    });
    if (existingSettlement) {
      return { finalized: false };
    }

    const votes = await tx.reportReview.findMany({
      where: { reportId, reviewerId: { not: null } },
      select: {
        action: true,
        rejectionTier: true,
        rejectionCode: true,
      },
    });
    if (votes.length < minR) {
      return { finalized: false };
    }

    const voteRows: VoteRow[] = votes.map((v) => ({
      action: v.action,
      rejectionTier: v.rejectionTier,
      rejectionCode: v.rejectionCode,
    }));

    const outcome = resolveReporterOutcome(voteRows);
    const finalAccept = outcome === "accepted";
    const rejectionReason = finalAccept
      ? null
      : outcome === "good_faith"
        ? "good_faith"
        : "bad_faith";
    const rejectionCode = pickOutcomeRejectionCode(outcome, voteRows);

    await tx.report.update({
      where: { id: reportId },
      data: finalAccept
        ? {
            status: "accepted",
            reviewedAt: new Date(),
            reviewedBy: lastReviewerUserId,
            rejectionReason: null,
            rejectionCode: null,
          }
        : {
            status: "rejected",
            reviewedAt: new Date(),
            reviewedBy: lastReviewerUserId,
            rejectionReason,
            rejectionCode,
          },
    });

    await tx.reportTokenSettlement.create({
      data: {
        reportId,
        outcome: finalAccept ? "accepted" : "rejected",
      },
    });

    return { finalized: true };
  });
}
