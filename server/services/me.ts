import { Elysia } from "elysia";
import { prisma } from "../db";
import { auth } from "@/lib/auth";
import { resolveInviteToken } from "../lib/auth-invite";

async function getSession(headers: Headers) {
  return auth.api.getSession({ headers });
}

export const meService = new Elysia({ prefix: "/me", aot: false })
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
            image: null,
            emailVerified: null,
            role: "user",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          session: null,
        };
      }
    }
    return { session };
  })
  .get("/", async ({ session }) => {
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }
    const [tokensCount, approvedRequestsCount] = await Promise.all([
      prisma.report.count({ where: { userId: session.user.id } }),
      prisma.report.count({
        where: { userId: session.user.id, status: "accepted" },
      }),
    ]);
    return {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      image: session.user.image,
      passkey: "",
      inviteCode: "",
      isActivated: true,
      tokensCount,
      approvedRequestsCount,
    };
  });
