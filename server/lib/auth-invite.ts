import { prisma } from "../db";

/** Resolve Bearer token from InviteSession to user. Returns null if invalid. */
export async function resolveInviteToken(
  authHeader: string | null,
): Promise<{ userId: string; name: string; email: string } | null> {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7).trim();
  if (!token) return null;

  const session = await prisma.inviteSession.findUnique({
    where: { token },
    include: { user: true },
  });
  if (!session || session.expiresAt < new Date() || !session.userId || !session.user) {
    return null;
  }
  return {
    userId: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role: session.user.role ?? "user",
  };
}
