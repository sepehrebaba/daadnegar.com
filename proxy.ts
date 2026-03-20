import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getServerSideAppOrigin } from "@/lib/app-base-url";
import { daadnegar_INVITE_TOKEN_COOKIE } from "@/lib/edyen";
import { routes } from "@/lib/routes";

export const config = {
  matcher: ["/admin", "/admin/:path*", "/panel", "/panel/:path*"],
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
  /** Same-process fetch; avoid https public origin inside the pod (TLS vs HTTP mismatch). */
  const internalOrigin = getServerSideAppOrigin();
  const baseUrl = request.nextUrl.origin;

  // --- Panel routes: require user auth, redirect to home if not logged in ---
  if (pathname.startsWith("/panel")) {
    const cookieHeader = request.headers.get("cookie") ?? "";
    const allowed = await panelRequestAllowed(internalOrigin, cookieHeader);
    if (!allowed) {
      return redirectToLogin(baseUrl, pathname);
    }

    return NextResponse.next();
  }

  // --- Admin routes ---
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  const res = await fetch(new URL("/api/admin/me", internalOrigin), {
    headers: {
      Cookie: request.headers.get("cookie") ?? "",
    },
    cache: "no-store",
  });

  if (res.status === 401) {
    const loginUrl = new URL("/admin/login", baseUrl);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}
