import { Elysia, t } from "elysia";
import { prisma } from "../db";
import { auth } from "@/lib/auth";
import { resolveInviteToken } from "../lib/auth-invite";
import { randomBytes } from "node:crypto";

const TOKEN_EXPIRY_DAYS = 365;
const INVITE_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // excluded 0,O,1,I for readability

function generateToken() {
  return randomBytes(32).toString("hex");
}

function generateInviteCode(): string {
  let code = "";
  const bytes = randomBytes(8);
  for (let i = 0; i < 8; i++) {
    code += INVITE_CODE_CHARS[bytes[i]! % INVITE_CODE_CHARS.length];
  }
  return code;
}

export async function ensureUniqueInviteCode(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const code = generateInviteCode();
    const existing = await prisma.inviteCode.findUnique({ where: { code } });
    if (!existing) return code;
  }
  throw new Error("Failed to generate unique invite code");
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
      // Support both: 1) Bearer token (InviteCode users), 2) Session cookie (accept-invitation users)
      let inviterId: string | null = null;
      const inviteUser = await resolveInviteToken(request.headers.get("Authorization"));
      if (inviteUser) {
        inviterId = inviteUser.userId;
      } else {
        const session = await auth.api.getSession({ headers: request.headers });
        if (session?.user?.id) inviterId = session.user.id;
      }
      if (!inviterId) {
        throw status(401, "لطفاً وارد شوید");
      }
      if (body.type === "personal" && !body.email?.trim()) {
        throw status(400, "برای دعوت شخصی ایمیل الزامی است");
      }

      const code = await ensureUniqueInviteCode();
      const invitedEmail = body.type === "personal" ? (body.email?.trim() ?? null) : null;

      await prisma.inviteCode.create({
        data: {
          code,
          ...(inviterId ? { inviter: { connect: { id: inviterId } } } : {}),
          invitedEmail,
        },
      });

      const baseURL =
        process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const registerLink = `${baseURL}/register?code=${code}`;

      // If email provided, send invitation email (TODO: integrate Resend/SendGrid)
      if (invitedEmail) {
        console.log("[invite-user] Send invitation email:", {
          to: invitedEmail,
          registerLink,
          code,
        });
        // TODO: await sendEmail({ to: invitedEmail, subject: 'دعوت به دادبان', body: `لینک ثبت‌نام: ${registerLink}\nکد دعوت: ${code}` });
      }

      return {
        ok: true,
        code,
        registerLink,
      };
    },
    {
      body: t.Object({
        type: t.Union([t.Literal("personal"), t.Literal("public")]),
        email: t.Optional(t.String()),
        name: t.Optional(t.String()),
      }),
    },
  )
  .get(
    "/check-code",
    async ({ query }) => {
      const normalizedCode = query.code?.trim().toUpperCase();
      if (!normalizedCode) return { ok: false };
      const inviteCode = await prisma.inviteCode.findFirst({
        where: {
          code: { equals: normalizedCode },
          isActive: true,
        },
      });
      if (!inviteCode || inviteCode.usedById) return { ok: false };
      return { ok: true };
    },
    { query: t.Object({ code: t.String() }) },
  )
  .post(
    "/register-by-code",
    async ({ body }) => {
      if (!body.email?.trim()) return { ok: false, error: "ایمیل الزامی است" };
      if (body.passkey.length < 6)
        return { ok: false, error: "رمز عبور باید حداقل ۶ کاراکتر باشد" };

      const normalizedCode = body.code.trim().toUpperCase();
      const inviteCode = await prisma.inviteCode.findFirst({
        where: { code: { equals: normalizedCode }, isActive: true },
      });
      if (!inviteCode || inviteCode.usedById) {
        return { ok: false, error: "کد دعوت نامعتبر یا قبلاً استفاده شده است" };
      }

      const email = body.email.trim();
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) return { ok: false, error: "این ایمیل قبلاً ثبت شده است" };

      const ctx = await auth.$context;
      const passkeyHash = await ctx.password.hash(body.passkey);

      const user = await prisma.user.create({
        data: {
          name: email.split("@")[0] ?? "کاربر",
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

      const sessionToken = generateToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + TOKEN_EXPIRY_DAYS);

      await prisma.inviteSession.create({
        data: {
          token: sessionToken,
          inviteCodeId: inviteCode.id,
          passkeyHash,
          userId: user.id,
          expiresAt,
        },
      });

      await prisma.inviteCode.update({
        where: { id: inviteCode.id },
        data: { usedById: user.id, isActive: false },
      });

      const [tokensCount, approvedRequestsCount] = await Promise.all([
        prisma.report.count({ where: { userId: user.id } }),
        prisma.report.count({
          where: { userId: user.id, status: "accepted" },
        }),
      ]);

      return {
        ok: true,
        token: sessionToken,
        user: {
          id: user.id,
          name: user.name,
          passkey: "",
          inviteCode: normalizedCode,
          isActivated: true,
          tokensCount,
          approvedRequestsCount,
        },
      };
    },
    {
      body: t.Object({
        code: t.String(),
        email: t.String(),
        passkey: t.String(),
      }),
    },
  );
