import { prisma } from "../db";

/** Token transaction type */
export const TOKEN_TRANSACTION_TYPES = {
  registration: "registration",
  report_submit_stake: "report_submit_stake",
  report_approved: "report_approved",
  report_false: "report_false",
  report_problematic: "report_problematic",
  invite_activity: "invite_activity",
  /** Manual credit from admin panel; shown as reward in history */
  admin_reward: "admin_reward",
  /** Majority settlement: reward reporter when report is finally accepted */
  consensus_reporter_reward: "consensus_reporter_reward",
  /** Majority settlement: penalty reporter when report is finally rejected */
  consensus_reporter_penalty: "consensus_reporter_penalty",
  /** Majority settlement: validator reward when vote matched final outcome — legacy */
  consensus_validator_correct: "consensus_validator_correct",
  /** Majority settlement: validator penalty when vote did not match final outcome — legacy */
  consensus_validator_wrong: "consensus_validator_wrong",
  /** Nominal refund to each validator after consensus settlement */
  consensus_validator_refund: "consensus_validator_refund",
  /** Bonus when vote matches final outcome */
  consensus_validator_match_bonus: "consensus_validator_match_bonus",
  /** Penalty for bad-faith reject vote when final outcome is accepted */
  consensus_validator_bad_faith_penalty: "consensus_validator_bad_faith_penalty",
} as const;

export type TokenTransactionType =
  (typeof TOKEN_TRANSACTION_TYPES)[keyof typeof TOKEN_TRANSACTION_TYPES];

/**
 * Records a token transaction and updates the tokenBalance cache in one DB transaction.
 * Positive amount = credit, negative = debit.
 * Debits cannot drive balance below zero.
 */
export async function addTokenTransaction(
  userId: string,
  amount: number,
  type: TokenTransactionType,
  refId?: string,
): Promise<void> {
  if (amount === 0) return;

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { tokenBalance: true },
    });
    if (!user) throw new Error("User not found");

    let newBalance: number;
    if (amount > 0) {
      newBalance = (user.tokenBalance ?? 0) + amount;
    } else {
      newBalance = Math.max(0, (user.tokenBalance ?? 0) + amount); // amount is negative
    }

    await tx.tokenTransaction.create({
      data: { userId, amount, type, refId: refId ?? undefined },
    });

    await tx.user.update({
      where: { id: userId },
      data: { tokenBalance: newBalance },
    });
  });
}
