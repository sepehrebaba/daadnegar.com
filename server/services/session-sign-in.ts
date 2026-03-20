import { Elysia, t } from "elysia";
import { prisma } from "../db";
import { auth } from "@/lib/auth";
import { isValidPublicUsername, normalizeUsername } from "@/lib/username";

/** ورود با نام کاربری: کاربر را از DB پیدا می‌کند و session Better Auth را با همان email داخلی می‌سازد. */
export const sessionSignInService = new Elysia({ prefix: "/session", aot: false }).post(
  "/sign-in",
  async ({ body, request }) => {
    const username = normalizeUsername(body.username);
    if (!isValidPublicUsername(username)) {
      return new Response(JSON.stringify({ message: "نام کاربری نامعتبر است" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return new Response(JSON.stringify({ message: "نام کاربری یا رمز عبور نادرست است" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    return auth.api.signInEmail({
      body: {
        email: user.email,
        password: body.password,
        rememberMe: body.rememberMe ?? true,
      },
      headers: request.headers,
      asResponse: true,
    });
  },
  {
    body: t.Object({
      username: t.String(),
      password: t.String(),
      rememberMe: t.Optional(t.Boolean()),
    }),
  },
);
