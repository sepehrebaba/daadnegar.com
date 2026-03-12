import { Elysia, t } from "elysia";
import { prisma } from "../db";
import { auth } from "@/lib/auth";
import { resolveInviteToken } from "../lib/auth-invite";
import { randomBytes } from "node:crypto";

const TOKEN_EXPIRY_DAYS = 365;

function generateToken() {
  return randomBytes(32).toString("hex");
}

export const inviteService = new Elysia({ prefix: "/invite", aot: false })
  .post(
    "/validate",
    async ({ body }) => {
      const normalizedCode = body.code.trim().toUpperCase();
      const inviteCode = await prisma.inviteCode.findFirst({
        where: {
          code: { equals: normalizedCode },
          isActive: true,
        },
      });
      if (!inviteCode) {
        return { ok: false, error: "کد دعوت نامعتبر است" };
      }
      if (inviteCode.usedById) {
        return { ok: false, error: "این کد دعوت قبلاً استفاده شده است" };
      }

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + TOKEN_EXPIRY_DAYS);
      const token = generateToken();

      const session = await prisma.inviteSession.create({
        data: {
          token,
          inviteCodeId: inviteCode.id,
          expiresAt,
        },
        include: { user: true },
      });

      const hasPasskey = !!session.passkeyHash;
      return {
        ok: true,
        token,
        hasPasskey,
        expiresAt: session.expiresAt.toISOString(),
      };
    },
    {
      body: t.Object({ code: t.String() }),
    },
  )
  .post(
    "/register",
    async ({ body }) => {
      if (body.passkey.length < 6) {
        return { ok: false, error: "رمز عبور باید حداقل ۶ کاراکتر باشد" };
      }

      const session = await prisma.inviteSession.findUnique({
        where: { token: body.token },
        include: { inviteCode: true },
      });
      if (!session || session.expiresAt < new Date()) {
        return { ok: false, error: "توکن نامعتبر یا منقضی شده است" };
      }
      if (session.userId) {
        return { ok: false, error: "این توکن قبلاً ثبت شده است" };
      }

      const ctx = await auth.$context;
      const passkeyHash = await ctx.password.hash(body.passkey);

      const email = `invite-${session.id}@dadban.local`;
      const user = await prisma.user.create({
        data: {
          name: `کاربر ${session.inviteCode.code}`,
          email,
          accounts: {
            create: {
              accountId: email,
              providerId: "invite-passkey",
              password: passkeyHash,
            },
          },
        },
      });

      await prisma.inviteSession.update({
        where: { id: session.id },
        data: { passkeyHash, userId: user.id },
      });

      const [tokensCount, approvedRequestsCount] = await Promise.all([
        prisma.report.count({ where: { userId: user.id } }),
        prisma.report.count({
          where: { userId: user.id, status: "accepted" },
        }),
      ]);

      return {
        ok: true,
        token: body.token,
        user: {
          id: user.id,
          name: user.name,
          passkey: "",
          inviteCode: session.inviteCode.code,
          isActivated: true,
          tokensCount,
          approvedRequestsCount,
        },
      };
    },
    {
      body: t.Object({
        token: t.String(),
        passkey: t.String(),
      }),
    },
  )
  .post(
    "/verify",
    async ({ body }) => {
      const session = await prisma.inviteSession.findUnique({
        where: { token: body.token },
        include: { user: true, inviteCode: true },
      });
      if (!session || session.expiresAt < new Date()) {
        return { ok: false, error: "توکن نامعتبر یا منقضی شده است" };
      }
      if (!session.passkeyHash || !session.userId) {
        return { ok: false, error: "لطفاً ابتدا رمز عبور را ثبت کنید" };
      }

      const ctx = await auth.$context;
      const isValid = await ctx.password.verify({
        password: body.passkey,
        hash: session.passkeyHash,
      });
      if (!isValid) {
        return { ok: false, error: "رمز عبور نادرست است" };
      }

      const user = session.user!;
      const [tokensCount, approvedRequestsCount] = await Promise.all([
        prisma.report.count({ where: { userId: user.id } }),
        prisma.report.count({
          where: { userId: user.id, status: "accepted" },
        }),
      ]);

      return {
        ok: true,
        token: body.token,
        user: {
          id: user.id,
          name: user.name,
          passkey: "",
          inviteCode: session.inviteCode.code,
          isActivated: true,
          tokensCount,
          approvedRequestsCount,
        },
      };
    },
    {
      body: t.Object({
        token: t.String(),
        passkey: t.String(),
      }),
    },
  )
  .get("/me", async ({ request }) => {
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
    if (!token) return { user: null };

    const session = await prisma.inviteSession.findUnique({
      where: { token },
      include: { user: true, inviteCode: true },
    });
    if (!session || session.expiresAt < new Date() || !session.userId || !session.user) {
      return { user: null };
    }

    const user = session.user;
    const [tokensCount, approvedRequestsCount] = await Promise.all([
      prisma.report.count({ where: { userId: user.id } }),
      prisma.report.count({
        where: { userId: user.id, status: "accepted" },
      }),
    ]);

    return {
      user: {
        id: user.id,
        name: user.name,
        passkey: "",
        inviteCode: session.inviteCode.code,
        isActivated: true,
        tokensCount,
        approvedRequestsCount,
      },
    };
  })
  .post(
    "/invite-user",
    async ({ body, request, status }) => {
      const inviteUser = await resolveInviteToken(request.headers.get("Authorization"));
      if (!inviteUser) {
        console.error("Unauthorized invite attempt");
        throw status(401, "لطفاً وارد شوید");
      }
      if (body.type === "personal" && !body.email?.trim()) {
        console.log("Personal invite attempt without email by user", inviteUser.userId);
        throw status(400, "برای دعوت شخصی ایمیل الزامی است");
      }

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const invite = await prisma.appInvitation.create({
        data: {
          inviterId: inviteUser.userId,
          email: body.type === "personal" ? body.email : null,
          name: body.type === "personal" && body.name ? body.name : null,
          status: "pending",
          expiresAt,
        },
      });

      const baseURL = process.env.BETTER_AUTH_URL || "http://localhost:3000";
      const inviteLink = `${baseURL}/accept-invitation?invitationId=${invite.id}`;

      return {
        ok: true,
        id: invite.id,
        inviteLink,
      };
    },
    {
      body: t.Object({
        type: t.Union([t.Literal("personal"), t.Literal("public")]),
        email: t.Optional(t.String()),
        name: t.Optional(t.String()),
      }),
    },
  );
