import { prisma } from "../db";
import { getSettingNumber, SETTING_KEYS } from "./settings";

/**
 * اگر گزارش هنوز pending است و به حد نصاب رأی رسیده و تسویه‌ای ثبت نشده، وضعیت نهایی و ردیف settlement را می‌سازد.
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
      select: { action: true },
    });
    if (votes.length < minR) {
      return { finalized: false };
    }

    const accepts = votes.filter((v) => v.action === "accepted").length;
    const rejects = votes.filter((v) => v.action === "rejected").length;
    const finalAccept = accepts > rejects;

    await tx.report.update({
      where: { id: reportId },
      data: finalAccept
        ? {
            status: "accepted",
            reviewedAt: new Date(),
            reviewedBy: lastReviewerUserId,
            rejectionReason: null,
          }
        : {
            status: "rejected",
            reviewedAt: new Date(),
            reviewedBy: lastReviewerUserId,
            rejectionReason: "problematic",
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
