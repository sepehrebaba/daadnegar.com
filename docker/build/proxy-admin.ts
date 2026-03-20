import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getServerSideAppOrigin } from "@/lib/app-base-url";

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const internalOrigin = getServerSideAppOrigin();
  const baseUrl = request.nextUrl.origin;

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
