import { prisma } from "../db";
import { getSettingFloat, SETTING_KEYS } from "./settings";
import {
  computeValidatorPayouts,
  resolveReporterOutcome,
  type ValidatorVoteRow,
  type VoteRow,
} from "./report-consensus-logic";
import { TOKEN_TRANSACTION_TYPES } from "./token-transaction";

type TxClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

function isBadFaithRejection(reason: string | null): boolean {
  return reason === "bad_faith" || reason === "false";
}

/** Apply rewards/penalties after the report outcome is final (majority vote). Single DB transaction. */
export async function processReportTokenSettlement(reportId: string): Promise<void> {
  const [reporterAccept, deductProblematic, deductFalse, refund, bonus3, bonus5, badFaithPenalty] =
    await Promise.all([
      getSettingFloat(SETTING_KEYS.TOKENS_CONSENSUS_REPORTER_ACCEPT),
      getSettingFloat(SETTING_KEYS.TOKENS_DEDUCT_PROBLEMATIC_REPORT),
      getSettingFloat(SETTING_KEYS.TOKENS_DEDUCT_FALSE_REPORT),
      getSettingFloat(SETTING_KEYS.TOKENS_CONSENSUS_VALIDATOR_REFUND),
      getSettingFloat(SETTING_KEYS.TOKENS_CONSENSUS_VALIDATOR_BONUS_MATCH_3),
      getSettingFloat(SETTING_KEYS.TOKENS_CONSENSUS_VALIDATOR_BONUS_MATCH_5),
      getSettingFloat(SETTING_KEYS.TOKENS_CONSENSUS_VALIDATOR_WRONG_PENALTY),
    ]);

  await prisma.$transaction(async (tx) => {
    const settlement = await tx.reportTokenSettlement.findUnique({
      where: { reportId },
    });
    if (!settlement || settlement.tokenLedgerDone) return;

    const report = await tx.report.findUnique({
      where: { id: reportId },
      select: { id: true, userId: true, status: true, rejectionReason: true },
    });
    if (!report || (report.status !== "accepted" && report.status !== "rejected")) return;

    const reviewRows = await tx.reportReview.findMany({
      where: { reportId, reviewerId: { not: null } },
      select: {
        reviewerId: true,
        action: true,
        rejectionTier: true,
        rejectionCode: true,
      },
    });
    if (reviewRows.length === 0) return;

    const voteRows: VoteRow[] = reviewRows.map((r) => ({
      action: r.action,
      rejectionTier: r.rejectionTier,
      rejectionCode: r.rejectionCode,
    }));
    const consensusOutcome = resolveReporterOutcome(voteRows);
    const validatorRows: ValidatorVoteRow[] = reviewRows.map((r) => ({
      reviewerId: r.reviewerId!,
      action: r.action,
      rejectionTier: r.rejectionTier,
      rejectionCode: r.rejectionCode,
    }));

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
      const rr = report.rejectionReason;
      const amount = isBadFaithRejection(rr) ? deductFalse : deductProblematic;
      await applyTx(
        tx,
        report.userId,
        -amount,
        TOKEN_TRANSACTION_TYPES.consensus_reporter_penalty,
        reportId,
      );
    }

    const payouts = computeValidatorPayouts(validatorRows, consensusOutcome, {
      refund,
      bonus3,
      bonus5,
      badFaithVsApprovePenalty: badFaithPenalty,
    });

    for (const line of payouts) {
      if (line.refund > 0) {
        await applyTx(
          tx,
          line.reviewerId,
          line.refund,
          TOKEN_TRANSACTION_TYPES.consensus_validator_refund,
          reportId,
        );
      }
      if (line.bonus > 0) {
        await applyTx(
          tx,
          line.reviewerId,
          line.bonus,
          TOKEN_TRANSACTION_TYPES.consensus_validator_match_bonus,
          reportId,
        );
      }
      if (line.penalty > 0) {
        await applyTx(
          tx,
          line.reviewerId,
          -line.penalty,
          TOKEN_TRANSACTION_TYPES.consensus_validator_bad_faith_penalty,
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
