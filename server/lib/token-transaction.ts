import { prisma } from "../db";

/** نوع تراکنش توکن */
export const TOKEN_TRANSACTION_TYPES = {
  registration: "registration",
  report_approved: "report_approved",
  report_false: "report_false",
  report_problematic: "report_problematic",
  invite_activity: "invite_activity",
} as const;

export type TokenTransactionType =
  (typeof TOKEN_TRANSACTION_TYPES)[keyof typeof TOKEN_TRANSACTION_TYPES];

/**
 * ثبت تراکنش توکن و آپدیت cache (tokenBalance) در یک transaction دیتابیس.
 * amount مثبت = واریز، منفی = برداشت.
 * برای برداشت، موجودی منفی نمی‌شود (حداقل ۰).
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
