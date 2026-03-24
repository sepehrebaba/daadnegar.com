import { Elysia, t } from "elysia";
import { prisma } from "../../db";
import { auth as authLib } from "@/lib/auth";
import { createAuditLog } from "../audit";
import { getAuditCtx } from "./shared";
import { addTokenTransaction, TOKEN_TRANSACTION_TYPES } from "../../lib/token-transaction";
import { getSettingNumber, SETTING_KEYS } from "../../lib/settings";
import { isValidPublicUsername, normalizeUsername, usernameToInternalEmail } from "@/lib/username";
import { generateRandomPassword } from "@/lib/password-utils";

export const adminUsersRoutes = new Elysia({ name: "adminUsers" })
  .get("/users", async () => {
    const data = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        tokenBalance: true,
        createdAt: true,
        _count: { select: { reports: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return { data };
  })
  .put(
    "/users/:id/role",
    async ({ params, body, request, ip, auth }) => {
      const user = await prisma.user.update({
        where: { id: params.id },
        data: { role: body.role },
      });
      await createAuditLog({
        action: "update",
        entity: "User",
        entityId: user.id,
        details: JSON.stringify({ role: body.role }),
        ctx: getAuditCtx(auth, {
          ip,
          userAgent: request.headers.get("user-agent") ?? undefined,
        }),
      });
      return user;
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({
        role: t.Union([t.Literal("user"), t.Literal("validator")]),
      }),
    },
  )
  .put(
    "/users/:id/password",
    async ({ params, body, request, ip, auth: adminAuth }) => {
      if (body.password.length < 8) throw new Error("رمز عبور باید حداقل ۸ کاراکتر باشد");
      if (!/[$@#!%*?&#^()[\]{}_\-+=.,:;]/.test(body.password))
        throw new Error("رمز عبور باید حداقل یک کاراکتر خاص داشته باشد");
      if (!/[A-Z]/.test(body.password))
        throw new Error("رمز عبور باید حداقل یک حرف بزرگ داشته باشد");
      if (!/[a-z]/.test(body.password))
        throw new Error("رمز عبور باید حداقل یک حرف کوچک داشته باشد");
      if (!/[0-9]/.test(body.password)) throw new Error("رمز عبور باید حداقل یک عدد داشته باشد");

      const ctx = await authLib.$context;
      const passkeyHash = await ctx.password.hash(body.password);

      await prisma.$transaction(async (tx) => {
        const targetUser = await tx.user.findUnique({
          where: { id: params.id },
          select: { id: true, email: true },
        });
        if (!targetUser) throw new Error("کاربر یافت نشد");

        await tx.user.update({
          where: { id: params.id },
          data: { mustChangePassword: false },
        });
        await tx.inviteSession.updateMany({
          where: { userId: params.id },
          data: { passkeyHash },
        });
        /*
         * Better Auth فقط اولین Account با providerId === "credential" را برای ورود ایمیل/رمز چک می‌کند.
         * فیلتر قبلی password: { not: null } ردیف‌های بدون رمز را رد می‌کرد → گاهی هیچ ردیفی
         * به‌روز نمی‌شد یا ردیفی که لاگین از آن استفاده می‌کند عوض نمی‌شد.
         */
        const updated = await tx.account.updateMany({
          where: { userId: params.id, providerId: "credential" },
          data: { password: passkeyHash },
        });
        if (updated.count === 0) {
          await tx.account.create({
            data: {
              userId: targetUser.id,
              accountId: targetUser.email,
              providerId: "credential",
              password: passkeyHash,
            },
          });
        }
      });

      await createAuditLog({
        action: "update",
        entity: "User",
        entityId: params.id,
        details: JSON.stringify({ field: "password" }),
        ctx: getAuditCtx(adminAuth, {
          ip,
          userAgent: request.headers.get("user-agent") ?? undefined,
        }),
      });
      return { success: true };
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({ password: t.String({ minLength: 8 }) }),
    },
  )
  .post(
    "/users/provision",
    async ({ body, request, ip, auth: adminAuth }) => {
      const role = body.role === "validator" ? "validator" : "user";
      const username = normalizeUsername(body.username);
      if (!username || !isValidPublicUsername(username)) {
        throw new Error(
          "نام کاربری معتبر نیست: ۳ تا ۳۲ کاراکتر، حروف کوچک انگلیسی، عدد و زیرخط؛ پیشوند dn_ مجاز نیست.",
        );
      }

      const email = usernameToInternalEmail(username);
      const taken = await prisma.user.findFirst({
        where: { OR: [{ username }, { email }] },
        select: { id: true },
      });
      if (taken) {
        throw new Error("این نام کاربری قبلاً ثبت شده است.");
      }

      const displayName = body.name?.trim() || username;

      const ctx = await authLib.$context;
      const password = generateRandomPassword(16);
      const passkeyHash = await ctx.password.hash(password);

      const defaultTokens = Math.max(
        0,
        await getSettingNumber(SETTING_KEYS.DEFAULT_TOKENS_NEW_USER),
      );

      let created: { id: string };
      try {
        created = await prisma.$transaction(async (tx) => {
          const row = await tx.user.create({
            data: {
              name: displayName,
              username,
              email,
              role,
              tokenBalance: defaultTokens,
              mustChangePassword: true,
              accounts: {
                create: {
                  accountId: email,
                  providerId: "credential",
                  password: passkeyHash,
                },
              },
            },
          });
          if (defaultTokens > 0) {
            await tx.tokenTransaction.create({
              data: {
                userId: row.id,
                amount: defaultTokens,
                type: TOKEN_TRANSACTION_TYPES.registration,
              },
            });
          }
          return row;
        });
      } catch (err: unknown) {
        console.error("[admin /users/provision] prisma transaction failed", err);
        const raw = err instanceof Error ? err.message : String(err);
        const lower = raw.toLowerCase();

        if (raw.includes("P2002") || lower.includes("unique constraint")) {
          throw new Error("این نام کاربری یا ایمیل داخلی قبلاً ثبت شده است.");
        }
        if (
          lower.includes("unknown column") ||
          raw.includes("1054") ||
          raw.includes("mustChangePassword") ||
          (lower.includes("column") && lower.includes("does not exist"))
        ) {
          throw new Error(
            "جدول User در دیتابیس ستون mustChangePassword ندارد. migration را اجرا کنید: pnpm prisma migrate deploy",
          );
        }

        throw new Error(
          process.env.NODE_ENV === "production"
            ? "ایجاد کاربر ناموفق بود. جزئیات در لاگ سرور ثبت شده است."
            : `ایجاد کاربر ناموفق: ${raw}`,
        );
      }

      await createAuditLog({
        action: "create",
        entity: "User",
        entityId: created.id,
        details: JSON.stringify({
          source: "admin_provision",
          username,
          role,
          mustChangePassword: true,
        }),
        ctx: getAuditCtx(adminAuth, {
          ip,
          userAgent: request.headers.get("user-agent") ?? undefined,
        }),
      });

      return {
        userId: created.id,
        username,
        password,
        name: displayName,
        role,
      };
    },
    {
      body: t.Object({
        username: t.String(),
        name: t.Optional(t.String()),
        role: t.Optional(t.Union([t.Literal("user"), t.Literal("validator")])),
      }),
    },
  )
  .post(
    "/users/:id/tokens",
    async ({ params, body, request, ip, auth: adminAuth }) => {
      const amount = Math.trunc(body.amount);
      if (!Number.isFinite(amount) || amount !== body.amount || amount < 1 || amount > 1_000_000) {
        throw new Error("تعداد توکن باید عدد صحیح بین ۱ تا ۱٬۰۰۰٬۰۰۰ باشد");
      }

      const exists = await prisma.user.findUnique({
        where: { id: params.id },
        select: { id: true },
      });
      if (!exists) throw new Error("کاربر یافت نشد");

      await addTokenTransaction(params.id, amount, TOKEN_TRANSACTION_TYPES.admin_reward);

      const user = await prisma.user.findUnique({
        where: { id: params.id },
        select: { tokenBalance: true },
      });

      await createAuditLog({
        action: "update",
        entity: "User",
        entityId: params.id,
        details: JSON.stringify({
          tokenGrant: amount,
          type: TOKEN_TRANSACTION_TYPES.admin_reward,
        }),
        ctx: getAuditCtx(adminAuth, {
          ip,
          userAgent: request.headers.get("user-agent") ?? undefined,
        }),
      });

      return { tokenBalance: user?.tokenBalance ?? 0 };
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({
        amount: t.Number({ minimum: 1, maximum: 1_000_000 }),
      }),
    },
  );
