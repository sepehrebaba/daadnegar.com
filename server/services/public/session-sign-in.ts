import { Elysia, t } from "elysia";
import { prisma } from "../../db";
import { auth } from "@/lib/auth";
import { sanitizeLoginIdentifier } from "@/lib/username";

function isLooselyValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+$/.test(s);
}

/** Sign-in with username or email: loads user from DB and creates Better Auth session with that email. */
export const sessionSignInService = new Elysia({
  prefix: "/session",
}).post(
  "/sign-in",
  async ({ body, request }) => {
    const id = sanitizeLoginIdentifier(body.username);
    if (!id) {
      return new Response(JSON.stringify({ message: "نام کاربری نامعتبر است" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    let user = null;

    if (id.includes("@")) {
      if (!isLooselyValidEmail(id)) {
        return new Response(JSON.stringify({ message: "ایمیل نامعتبر است" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      user = await prisma.user.findUnique({ where: { email: id } });
    } else {
      user = await prisma.user.findUnique({ where: { username: id } });
    }

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
