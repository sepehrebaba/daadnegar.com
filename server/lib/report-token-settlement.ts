import { prisma } from "../db";
import { getSettingNumber, SETTING_KEYS } from "./settings";
import { TOKEN_TRANSACTION_TYPES } from "./token-transaction";

type TxClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

/** اعمال پاداش/جریمه پس از قطعی شدن گزارش (اکثریت رأی). یک تراکنش دیتابیس. */
export async function processReportTokenSettlement(reportId: string): Promise<void> {
  const [reporterAccept, reporterPenalty, validatorCorrect, validatorWrong] = await Promise.all([
    getSettingNumber(SETTING_KEYS.TOKENS_CONSENSUS_REPORTER_ACCEPT),
    getSettingNumber(SETTING_KEYS.TOKENS_CONSENSUS_REPORTER_REJECT_PENALTY),
    getSettingNumber(SETTING_KEYS.TOKENS_CONSENSUS_VALIDATOR_CORRECT),
    getSettingNumber(SETTING_KEYS.TOKENS_CONSENSUS_VALIDATOR_WRONG_PENALTY),
  ]);

  await prisma.$transaction(async (tx) => {
    const settlement = await tx.reportTokenSettlement.findUnique({
      where: { reportId },
    });
    if (!settlement || settlement.tokenLedgerDone) return;

    const report = await tx.report.findUnique({
      where: { id: reportId },
      select: { id: true, userId: true, status: true },
    });
    if (!report || (report.status !== "accepted" && report.status !== "rejected")) return;

    const reviews = await tx.reportReview.findMany({
      where: { reportId, reviewerId: { not: null } },
      select: { reviewerId: true, action: true },
    });
    if (reviews.length === 0) return;

    const outcomeAccepted = report.status === "accepted";

    if (outcomeAccepted) {
      await applyTx(
        tx,
        report.userId,
        reporterAccept,
        TOKEN_TRANSACTION_TYPES.consensus_reporter_reward,
        reportId,
      );
    } else {
      await applyTx(
        tx,
        report.userId,
        -reporterPenalty,
        TOKEN_TRANSACTION_TYPES.consensus_reporter_penalty,
        reportId,
      );
    }

    for (const r of reviews) {
      const uid = r.reviewerId!;
      const votedAccept = r.action === "accepted";
      const match = (votedAccept && outcomeAccepted) || (!votedAccept && !outcomeAccepted);
      if (match) {
        await applyTx(
          tx,
          uid,
          validatorCorrect,
          TOKEN_TRANSACTION_TYPES.consensus_validator_correct,
          reportId,
        );
      } else {
        await applyTx(
          tx,
          uid,
          -validatorWrong,
          TOKEN_TRANSACTION_TYPES.consensus_validator_wrong,
          reportId,
        );
      }
    }

    await tx.reportTokenSettlement.update({
      where: { reportId },
      data: { tokenLedgerDone: true },
    });
  });
}

async function applyTx(
  tx: TxClient,
  userId: string,
  amount: number,
  type: (typeof TOKEN_TRANSACTION_TYPES)[keyof typeof TOKEN_TRANSACTION_TYPES],
  refId: string,
): Promise<void> {
  if (amount === 0) return;

  const user = await tx.user.findUnique({
    where: { id: userId },
    select: { tokenBalance: true },
  });
  if (!user) return;

  let newBalance: number;
  if (amount > 0) {
    newBalance = (user.tokenBalance ?? 0) + amount;
  } else {
    newBalance = Math.max(0, (user.tokenBalance ?? 0) + amount);
  }

  await tx.tokenTransaction.create({
    data: { userId, amount, type, refId },
  });
  await tx.user.update({
    where: { id: userId },
    data: { tokenBalance: newBalance },
  });
}
