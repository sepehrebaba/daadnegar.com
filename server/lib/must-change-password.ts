import { prisma } from "../db";

export const MUST_CHANGE_PASSWORD_MESSAGE = "MUST_CHANGE_PASSWORD";

/** For users who must change their initial password; call before other panel operations. */
export async function assertPasswordChangeNotRequired(userId: string): Promise<void> {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { mustChangePassword: true },
  });
  if (u?.mustChangePassword) {
    throw new Error(MUST_CHANGE_PASSWORD_MESSAGE);
  }
}
