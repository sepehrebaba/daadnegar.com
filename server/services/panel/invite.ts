import { Elysia, t } from "elysia";
import { ip } from "elysia-ip";
import { prisma } from "../../db";
import { createAuditLog } from "../audit";
import { auth } from "@/lib/auth";
import { resolveInviteToken } from "../../lib/auth-invite";
import { getSettingNumber, SETTING_KEYS } from "../../lib/settings";
import { TOKEN_TRANSACTION_TYPES } from "../../lib/token-transaction";
import { randomBytes } from "node:crypto";
import { isValidPublicUsername, normalizeUsername, usernameToInternalEmail } from "@/lib/username";
import { assertPasswordChangeNotRequired } from "../../lib/must-change-password";
import { DefaultContext, type Generator, rateLimit } from "elysia-rate-limit";

const ipGenerator: Generator<{ ip: string }> = (_r, _s, { ip }) => ip ?? "unknown";

const TOKEN_EXPIRY_DAYS = 365;
const MIN_ACCOUNT_AGE_DAYS_FOR_INVITE = 3;
const INVITE_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // excluded 0,O,1,I for readability

function roleFromAssignedInvite(assignedRole: string | null | undefined): string {
  return assignedRole === "validator" ? "validator" : "user";
}

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

export const inviteService = new Elysia({ prefix: "/invite" })
  .use(ip())
  .post(
    "/validate",
    async ({ body, request, ip }) => {
      const normalizedCode = body.code.trim().toUpperCase();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + TOKEN_EXPIRY_DAYS);
      const token = generateToken();

      // Atomically claim the invite code so concurrent validations cannot both succeed.
      const claimed = await prisma.$transaction(async (tx) => {
        const inviteCode = await tx.inviteCode.findFirst({
          where: {
            code: { equals: normalizedCode },
            isActive: true,
            usedById: null,
          },
          select: {
            id: true,
            code: true,
          },
        });
        if (!inviteCode) return null;

        const claim = await tx.inviteCode.updateMany({
          where: {
            id: inviteCode.id,
            isActive: true,
            usedById: null,
          },
          data: {
            isActive: false,
          },
        });
        if (claim.count === 0) return null;

        const session = await tx.inviteSession.create({
          data: {
            token,
            inviteCodeId: inviteCode.id,
            expiresAt,
          },
        });

        return { inviteCode, session };
      });
      if (!claimed) {
        return { ok: false, error: "کد دعوت نامعتبر یا قبلاً استفاده شده است" };
      }

      await createAuditLog({
        action: "validate",
        entity: "InviteCode",
        entityId: claimed.inviteCode.id,
        details: JSON.stringify({ code: claimed.inviteCode.code }),
        ctx: {
          ipAddress: ip,
          userAgent: request.headers.get("user-agent") ?? undefined,
        },
      });

      const hasPasskey = !!claimed.session.passkeyHash;
      return {
        ok: true,
        token,
        hasPasskey,
        expiresAt: claimed.session.expiresAt.toISOString(),
      };
    },
    {
      body: t.Object({ code: t.String() }),
    },
  )
  .post(
    "/register",
    async ({ body, request, ip }) => {
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
      const defaultTokens = Math.max(
        0,
        await getSettingNumber(SETTING_KEYS.DEFAULT_TOKENS_NEW_USER),
      );

      const username = `dn_${session.inviteCode.code.toLowerCase()}`;
      const email = usernameToInternalEmail(username);
      const preferredLanguage = body.preferredLanguage === "en" ? "en" : "fa";

      const user = await prisma.$transaction(async (tx) => {
        const u = await tx.user.create({
          data: {
            name: `کاربر ${session.inviteCode.code}`,
            username,
            email,
            role: roleFromAssignedInvite(session.inviteCode.assignedRole),
            preferredLanguage,
            tokenBalance: defaultTokens,
            accounts: {
              create: {
                accountId: email,
                providerId: "credential",
                password: passkeyHash,
              },
            },
          },
        });
        await tx.tokenTransaction.create({
          data: {
            userId: u.id,
            amount: defaultTokens,
            type: TOKEN_TRANSACTION_TYPES.registration,
          },
        });
        await tx.inviteSession.update({
          where: { id: session.id },
          data: { passkeyHash, userId: u.id },
        });
        await tx.inviteCode.update({
          where: { id: session.inviteCodeId },
          data: { usedById: u.id, isActive: false },
        });
        return u;
      });

      await createAuditLog({
        action: "register",
        entity: "User",
        entityId: user.id,
        details: JSON.stringify({ inviteCode: session.inviteCode.code }),
        ctx: {
          userId: user.id,
          ipAddress: ip,
          userAgent: request.headers.get("user-agent") ?? undefined,
        },
      });

      const approvedRequestsCount = await prisma.report.count({
        where: { userId: user.id, status: "accepted" },
      });

      return {
        ok: true,
        token: body.token,
        user: {
          id: user.id,
          name: user.name,
          username: user.username,
          passkey: "",
          inviteCode: session.inviteCode.code,
          isActivated: true,
          tokensCount: user.tokenBalance ?? 0,
          approvedRequestsCount,
          role: user.role ?? "user",
          preferredLanguage:
            user.preferredLanguage === "en" || user.preferredLanguage === "fa"
              ? user.preferredLanguage
              : "fa",
        },
      };
    },
    {
      body: t.Object({
        token: t.String(),
        passkey: t.String(),
        preferredLanguage: t.Optional(t.Union([t.Literal("fa"), t.Literal("en")])),
      }),
    },
  )
  .post(
    "/verify",
    async ({ body, request, ip }) => {
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
      await createAuditLog({
        action: "login",
        entity: "User",
        entityId: user.id,
        details: JSON.stringify({ inviteCode: session.inviteCode?.code }),
        ctx: {
          userId: user.id,
          ipAddress: ip,
          userAgent: request.headers.get("user-agent") ?? undefined,
        },
      });

      const [approvedRequestsCount] = await Promise.all([
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
          username: user.username,
          passkey: "",
          inviteCode: session.inviteCode.code,
          isActivated: true,
          tokensCount: user.tokenBalance ?? 0,
          approvedRequestsCount,
          role: user.role ?? "user",
          preferredLanguage:
            user.preferredLanguage === "en" || user.preferredLanguage === "fa"
              ? user.preferredLanguage
              : "fa",
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
    const [approvedRequestsCount] = await Promise.all([
      prisma.report.count({
        where: { userId: user.id, status: "accepted" },
      }),
    ]);

    return {
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        passkey: "",
        inviteCode: session.inviteCode.code,
        isActivated: true,
        tokensCount: user.tokenBalance ?? 0,
        approvedRequestsCount,
        role: user.role ?? "user",
        preferredLanguage:
          user.preferredLanguage === "en" || user.preferredLanguage === "fa"
            ? user.preferredLanguage
            : "fa",
      },
    };
  })
  .post(
    "/invite-user",
    async ({ body, request, status, ip }) => {
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
      await assertPasswordChangeNotRequired(inviterId);
      const inviter = await prisma.user.findUnique({
        where: { id: inviterId },
        select: { createdAt: true, tokenBalance: true },
      });
      if (!inviter) {
        throw status(404, "کاربر دعوت‌کننده یافت نشد");
      }
      const minAccountAgeMs = MIN_ACCOUNT_AGE_DAYS_FOR_INVITE * 24 * 60 * 60 * 1000;
      if (Date.now() - inviter.createdAt.getTime() < minAccountAgeMs) {
        throw status(
          403,
          `برای ساخت کد دعوت باید حداقل ${MIN_ACCOUNT_AGE_DAYS_FOR_INVITE} روز از عضویت شما گذشته باشد.`,
        );
      }
      const inviteCreateStake = Math.max(
        0,
        await getSettingNumber(SETTING_KEYS.TOKENS_INVITE_CREATE_STAKE),
      );
      if ((inviter.tokenBalance ?? 0) < inviteCreateStake) {
        throw status(400, `حداقل ${inviteCreateStake} توکن برای ساخت کد دعوت (وثیقه) لازم است.`);
      }
      if (body.type === "personal") {
        const u = normalizeUsername(body.username ?? "");
        if (!u || !isValidPublicUsername(u)) {
          throw status(
            400,
            "برای دعوت شخصی نام کاربری معتبر (۳–۳۲ کاراکتر، انگلیسی کوچک، عدد و _) الزامی است",
          );
        }
      }

      const maxUnused = await getSettingNumber(SETTING_KEYS.MAX_INVITE_CODES_UNUSED);
      const unusedCount = await prisma.inviteCode.count({
        where: { inviterId, usedById: null, isActive: true },
      });
      if (maxUnused > 0 && unusedCount >= maxUnused) {
        throw status(
          400,
          `حداکثر ${maxUnused} کد دعوت استفاده‌نشده مجاز است. لطفاً از کدهای قبلی استفاده کنید یا منتظر بمانید تا کسی ثبت‌نام کند.`,
        );
      }

      const code = await ensureUniqueInviteCode();
      let inviteCodeRecord;
      try {
        inviteCodeRecord = await prisma.$transaction(async (tx) => {
          const created = await tx.inviteCode.create({
            data: {
              code,
              ...(inviterId ? { inviter: { connect: { id: inviterId } } } : {}),
            },
          });
          if (inviteCreateStake > 0) {
            const debited = await tx.user.updateMany({
              where: { id: inviterId, tokenBalance: { gte: inviteCreateStake } },
              data: { tokenBalance: { decrement: inviteCreateStake } },
            });
            if (debited.count === 0) {
              throw new Error("INSUFFICIENT_BALANCE_FOR_INVITE_STAKE");
            }
            await tx.tokenTransaction.create({
              data: {
                userId: inviterId,
                amount: -inviteCreateStake,
                type: TOKEN_TRANSACTION_TYPES.invite_create_stake,
                refId: created.id,
              },
            });
          }
          return created;
        });
      } catch (err) {
        if (err instanceof Error && err.message === "INSUFFICIENT_BALANCE_FOR_INVITE_STAKE") {
          throw status(400, `حداقل ${inviteCreateStake} توکن برای ساخت کد دعوت (وثیقه) لازم است.`);
        }
        throw err;
      }

      await createAuditLog({
        action: "create",
        entity: "InviteCode",
        entityId: inviteCodeRecord.id,
        details: JSON.stringify({ code, type: body.type }),
        ctx: {
          userId: inviterId ?? undefined,
          ipAddress: ip,
          userAgent: request.headers.get("user-agent") ?? undefined,
        },
      });

      const baseURL =
        process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const registerLink = `${baseURL}/auth/register?code=${code}`;

      return {
        ok: true,
        code,
        registerLink,
      };
    },
    {
      body: t.Object({
        type: t.Union([t.Literal("personal"), t.Literal("public")]),
        username: t.Optional(t.String()),
        name: t.Optional(t.String()),
      }),
    },
  )
  .get("/my-codes", async ({ request, status }) => {
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

    await assertPasswordChangeNotRequired(inviterId);

    const codes = await prisma.inviteCode.findMany({
      where: { inviterId },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        code: true,
        usedById: true,
        isActive: true,
        createdAt: true,
      },
    });

    return codes.map((c) => ({
      id: c.id,
      code: c.code,
      used: !!c.usedById,
      isActive: c.isActive,
      createdAt: c.createdAt.toISOString(),
    }));
  })
  .use(
    rateLimit({
      duration: 60_000,
      max: 10,
      headers: false,
      scoping: "scoped",
      countFailedRequest: true,
      errorResponse: new Response(JSON.stringify({ ok: false, error: "Too many requests" }), {
        status: 429,
      }),
      generator: ipGenerator,
      context: new DefaultContext(10_000),
    }),
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
    async ({ body, request, ip }) => {
      const usernameRaw = normalizeUsername(body.username ?? "");
      if (!usernameRaw || !isValidPublicUsername(usernameRaw)) {
        return {
          ok: false,
          error: "نام کاربری معتبر (۳–۳۲ کاراکتر، انگلیسی کوچک، عدد و _) الزامی است",
        };
      }
      if (body.passkey.length < 8)
        return { ok: false, error: "رمز عبور باید حداقل ۸ کاراکتر باشد" };
      if (!/[$@#!%*?&#^()[\]{}_\-+=.,:;]/.test(body.passkey))
        return {
          ok: false,
          error: "رمز عبور باید حداقل یک کاراکتر خاص داشته باشد",
        };
      if (!/[A-Z]/.test(body.passkey))
        return {
          ok: false,
          error: "رمز عبور باید حداقل یک حرف بزرگ داشته باشد",
        };
      if (!/[a-z]/.test(body.passkey))
        return {
          ok: false,
          error: "رمز عبور باید حداقل یک حرف کوچک داشته باشد",
        };
      if (!/[0-9]/.test(body.passkey))
        return { ok: false, error: "رمز عبور باید حداقل یک عدد داشته باشد" };

      const normalizedCode = body.code.trim().toUpperCase();
      const inviteCode = await prisma.inviteCode.findFirst({
        where: { code: { equals: normalizedCode }, isActive: true },
      });
      if (!inviteCode || inviteCode.usedById) {
        return { ok: false, error: "کد دعوت نامعتبر یا قبلاً استفاده شده است" };
      }

      const email = usernameToInternalEmail(usernameRaw);
      const existingUser =
        (await prisma.user.findUnique({ where: { username: usernameRaw } })) ??
        (await prisma.user.findUnique({ where: { email } }));
      if (existingUser) return { ok: false, error: "این نام کاربری قبلاً ثبت شده است" };

      const ctx = await auth.$context;
      const passkeyHash = await ctx.password.hash(body.passkey);
      const defaultTokens = Math.max(
        0,
        await getSettingNumber(SETTING_KEYS.DEFAULT_TOKENS_NEW_USER),
      );

      const preferredLanguage = body.preferredLanguage === "en" ? "en" : "fa";

      const sessionToken = generateToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + TOKEN_EXPIRY_DAYS);

      const user = await prisma.$transaction(async (tx) => {
        const u = await tx.user.create({
          data: {
            name: usernameRaw,
            username: usernameRaw,
            email,
            role: roleFromAssignedInvite(inviteCode.assignedRole),
            preferredLanguage,
            tokenBalance: defaultTokens,
            accounts: {
              create: {
                accountId: email,
                providerId: "credential",
                password: passkeyHash,
              },
            },
          },
        });
        await tx.tokenTransaction.create({
          data: {
            userId: u.id,
            amount: defaultTokens,
            type: TOKEN_TRANSACTION_TYPES.registration,
          },
        });
        await tx.inviteSession.create({
          data: {
            token: sessionToken,
            inviteCodeId: inviteCode.id,
            passkeyHash,
            userId: u.id,
            expiresAt,
          },
        });
        await tx.inviteCode.update({
          where: { id: inviteCode.id },
          data: { usedById: u.id, isActive: false },
        });
        return u;
      });

      await createAuditLog({
        action: "register",
        entity: "User",
        entityId: user.id,
        details: JSON.stringify({
          inviteCode: normalizedCode,
          username: usernameRaw,
          role: user.role,
        }),
        ctx: {
          userId: user.id,
          ipAddress: ip,
          userAgent: request.headers.get("user-agent") ?? undefined,
        },
      });

      const [approvedRequestsCount] = await Promise.all([
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
          username: user.username,
          passkey: "",
          inviteCode: normalizedCode,
          isActivated: true,
          tokensCount: user.tokenBalance ?? 0,
          approvedRequestsCount,
          role: user.role ?? "user",
          preferredLanguage:
            user.preferredLanguage === "en" || user.preferredLanguage === "fa"
              ? user.preferredLanguage
              : "fa",
        },
      };
    },
    {
      body: t.Object({
        code: t.String(),
        username: t.String(),
        passkey: t.String(),
        preferredLanguage: t.Optional(t.Union([t.Literal("fa"), t.Literal("en")])),
      }),
    },
  );
