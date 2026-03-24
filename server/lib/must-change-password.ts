import { prisma } from "../db";

export const MUST_CHANGE_PASSWORD_MESSAGE = "MUST_CHANGE_PASSWORD";

/** برای کاربرانی که باید رمز اولیه را عوض کنند؛ قبل از سایر عملیات پنل فراخوانی شود. */
export async function assertPasswordChangeNotRequired(userId: string): Promise<void> {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { mustChangePassword: true },
  });
  if (u?.mustChangePassword) {
    throw new Error(MUST_CHANGE_PASSWORD_MESSAGE);
  }
}
