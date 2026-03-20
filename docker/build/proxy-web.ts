import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getServerSideAppOrigin } from "@/lib/app-base-url";
import { daadnegar_INVITE_TOKEN_COOKIE } from "@/lib/edyen";
import { routes } from "@/lib/routes";

export const config = {
  matcher: ["/panel", "/panel/:path*"],
};

function getInviteTokenFromCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(?:^|; )${daadnegar_INVITE_TOKEN_COOKIE}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function redirectToLogin(baseUrl: string, pathname: string) {
  const url = new URL(routes.login, baseUrl);
  url.searchParams.set("from", pathname);
  return NextResponse.redirect(url);
}

async function panelRequestAllowed(internalOrigin: string, cookieHeader: string): Promise<boolean> {
  const inviteToken = getInviteTokenFromCookie(cookieHeader);
  const headers: HeadersInit = {
    Cookie: cookieHeader,
    "Content-Type": "application/json",
  };
  if (inviteToken) {
    headers["Authorization"] = `Bearer ${inviteToken}`;
  }

  try {
    const res = await fetch(new URL("/api/me", internalOrigin), {
      headers,
      cache: "no-store",
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { id?: string };
    return Boolean(data?.id);
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const internalOrigin = getServerSideAppOrigin();
  const baseUrl = request.nextUrl.origin;

  if (pathname.startsWith("/panel")) {
    const cookieHeader = request.headers.get("cookie") ?? "";
    const allowed = await panelRequestAllowed(internalOrigin, cookieHeader);
    if (!allowed) {
      return redirectToLogin(baseUrl, pathname);
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}
