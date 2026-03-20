import { PrismaClient } from "@/generated/prisma/client";
import { betterAuth } from "better-auth";
import { createAuthMiddleware } from "better-auth/api";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { createAuditLog } from "@/server/services/audit";

const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST || "127.0.0.1",
  port: Number(process.env.DATABASE_PORT) || 3307,
  user: process.env.DATABASE_USER || "daadnegar",
  password: process.env.DATABASE_PASSWORD || "daadnegar_secret",
  database: process.env.DATABASE_NAME || "daadnegar",
  connectionLimit: 5,
});

const client = new PrismaClient({ adapter });

const baseURL = process.env.BETTER_AUTH_URL || "http://localhost:3000";

export const auth = betterAuth({
  database: prismaAdapter(client, { provider: "mysql" }),
  baseURL,
  secret: process.env.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
    disableSignUp: true, // invite-only: sign up only via invitation
  },
  // Invite flow is handled by custom InviteCode + /register page, not app-invite
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      if (ctx.path === "/sign-in/email") {
        const newSession = ctx.context.newSession;
        if (newSession?.user?.id) {
          const u = await client.user.findUnique({
            where: { id: newSession.user.id },
            select: { username: true },
          });
          await createAuditLog({
            action: "login",
            entity: "User",
            entityId: newSession.user.id,
            details: JSON.stringify({ username: u?.username ?? null }),
            ctx: {
              userId: newSession.user.id,
              ipAddress:
                ctx.headers?.get?.("x-forwarded-for")?.split(",")[0]?.trim() ??
                ctx.headers?.get?.("x-real-ip") ??
                undefined,
              userAgent: ctx.headers?.get?.("user-agent") ?? undefined,
            },
          });
        }
      }
    }),
  },
});
