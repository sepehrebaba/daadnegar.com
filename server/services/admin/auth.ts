import { Elysia, t } from "elysia";
import { prisma } from "../../db";
import { auth } from "@/lib/auth";
import { createAuditLog } from "../audit";
import { randomBytes, timingSafeEqual } from "node:crypto";
import { isPasswordSecure } from "@/lib/password-utils";

const ADMIN_PANEL_COOKIE = "admin_panel_session";
const SESSION_MINUTES = 10;

function generateToken() {
  return randomBytes(32).toString("hex");
}

function timingSafeEqualString(a: string, b: string): boolean {
  const aBuf = Buffer.from(a, "utf8");
  const bBuf = Buffer.from(b, "utf8");
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

export const adminPanelAuthService = new Elysia({
  prefix: "/admin-panel/auth",
})
  .post(
    "/login",
    async ({ body, set, request }) => {
      const panelUser = await prisma.adminPanelUser.findUnique({
        where: { username: body.username },
      });
      if (!panelUser) {
        set.status = 401;
        return { error: "Invalid credentials" };
      }

      const ctx = await auth.$context;
      const isValid = await ctx.password.verify({
        password: body.password,
        hash: panelUser.passwordHash,
      });
      if (!isValid) {
        set.status = 401;
        return { error: "Invalid credentials" };
      }

      const token = generateToken();
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + SESSION_MINUTES);

      await prisma.adminPanelSession.create({
        data: {
          adminPanelUserId: panelUser.id,
          token,
          expiresAt,
        },
      });

      await createAuditLog({
        action: "login",
        entity: "AdminPanel",
        entityId: panelUser.id,
        details: JSON.stringify({ username: panelUser.username }),
        ctx: {
          adminPanelUserId: panelUser.id,
          adminPanelUsername: panelUser.username,
          userAgent: request.headers.get("user-agent") ?? undefined,
        },
      });

      const secure = process.env.NODE_ENV === "production";
      set.headers["Set-Cookie"] =
        `${ADMIN_PANEL_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_MINUTES * 60}${secure ? "; Secure" : ""}`;
      return { success: true, username: panelUser.username };
    },
    {
      body: t.Object({
        username: t.String(),
        password: t.String(),
      }),
    },
  )
  .post("/logout", async ({ set, request }) => {
    const cookieHeader = request.headers.get("Cookie") ?? "";
    const match = cookieHeader.match(new RegExp(`${ADMIN_PANEL_COOKIE}=([^;]+)`));
    const token = match?.[1];
    if (token) {
      const session = await prisma.adminPanelSession.findFirst({
        where: { token },
        include: { adminPanelUser: true },
      });
      if (session && timingSafeEqualString(token, session.token)) {
        await createAuditLog({
          action: "logout",
          entity: "AdminPanel",
          entityId: session.adminPanelUser.id,
          details: JSON.stringify({
            username: session.adminPanelUser.username,
          }),
          ctx: {
            adminPanelUserId: session.adminPanelUser.id,
            adminPanelUsername: session.adminPanelUser.username,
            userAgent: request.headers.get("user-agent") ?? undefined,
          },
        });
      }
      await prisma.adminPanelSession.deleteMany({ where: { token } });
    }
    const secure = process.env.NODE_ENV === "production";
    set.headers["Set-Cookie"] =
      `${ADMIN_PANEL_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure ? "; Secure" : ""}`;
    return { success: true };
  })
  .get("/me", async ({ request }) => {
    const cookieHeader = request.headers.get("Cookie") ?? "";
    const match = cookieHeader.match(new RegExp(`${ADMIN_PANEL_COOKIE}=([^;]+)`));
    const token = match?.[1];
    if (!token) return { user: null };

    const session = await prisma.adminPanelSession.findUnique({
      where: { token },
      include: { adminPanelUser: true },
    });
    if (
      !session ||
      !timingSafeEqualString(token, session.token) ||
      session.expiresAt < new Date()
    ) {
      if (session) {
        await prisma.adminPanelSession.delete({ where: { id: session.id } });
      }
      return { user: null };
    }
    return { user: { username: session.adminPanelUser.username } };
  })
  .put(
    "/password",
    async ({ body, request, set }) => {
      const panel = await getAdminPanelSession(request);
      if (!panel) {
        set.status = 401;
        return { error: "Unauthorized" };
      }

      const panelUser = await prisma.adminPanelUser.findUnique({
        where: { id: panel.adminPanelUser.id },
      });
      if (!panelUser) {
        set.status = 401;
        return { error: "Unauthorized" };
      }

      const ctx = await auth.$context;
      const currentOk = await ctx.password.verify({
        password: body.currentPassword,
        hash: panelUser.passwordHash,
      });
      if (!currentOk) {
        set.status = 400;
        return { error: "رمز عبور فعلی نادرست است" };
      }

      if (!isPasswordSecure(body.newPassword)) {
        set.status = 400;
        return {
          error: "رمز جدید باید حداقل ۸ کاراکتر و شامل حرف بزرگ، حرف کوچک، عدد و کاراکتر خاص باشد",
        };
      }

      const passwordHash = await ctx.password.hash(body.newPassword);
      await prisma.adminPanelUser.update({
        where: { id: panelUser.id },
        data: { passwordHash },
      });

      await createAuditLog({
        action: "update",
        entity: "AdminPanel",
        entityId: panelUser.id,
        details: JSON.stringify({ field: "password", self: true }),
        ctx: {
          adminPanelUserId: panelUser.id,
          adminPanelUsername: panelUser.username,
          userAgent: request.headers.get("user-agent") ?? undefined,
        },
      });

      return { success: true };
    },
    {
      body: t.Object({
        currentPassword: t.String(),
        newPassword: t.String({ minLength: 8 }),
      }),
    },
  );

export async function getAdminPanelSession(request: Request): Promise<{
  adminPanelUser: { id: string; username: string };
} | null> {
  const cookieHeader = request.headers.get("Cookie") ?? "";
  const match = cookieHeader.match(new RegExp(`${ADMIN_PANEL_COOKIE}=([^;]+)`));
  const token = match?.[1];
  if (!token) return null;

  const session = await prisma.adminPanelSession.findUnique({
    where: { token },
    include: { adminPanelUser: true },
  });
  if (!session || !timingSafeEqualString(token, session.token) || session.expiresAt < new Date()) {
    if (session) {
      await prisma.adminPanelSession.delete({ where: { id: session.id } });
    }
    return null;
  }
  return { adminPanelUser: session.adminPanelUser };
}
