import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getServerSideAppOrigin } from "@/lib/app-base-url";
import { daadnegar_INVITE_TOKEN_COOKIE } from "@/lib/edyen";

export const config = {
  matcher: ["/panel", "/panel/:path*"],
};

function getInviteTokenFromCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(?:^|; )${daadnegar_INVITE_TOKEN_COOKIE}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const internalOrigin = getServerSideAppOrigin();
  const baseUrl = request.nextUrl.origin;

  if (pathname.startsWith("/panel")) {
    const cookieHeader = request.headers.get("cookie") ?? "";
    const inviteToken = getInviteTokenFromCookie(cookieHeader);

    const headers: HeadersInit = {
      Cookie: cookieHeader,
      "Content-Type": "application/json",
    };
    if (inviteToken) {
      headers["Authorization"] = `Bearer ${inviteToken}`;
    }

    const res = await fetch(new URL("/api/me", internalOrigin), {
      headers,
      cache: "no-store",
    });

    if (res.status === 401 || !res.ok) {
      return NextResponse.redirect(new URL("/", baseUrl));
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}
