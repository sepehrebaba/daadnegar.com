import { headers, cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { resolveInviteToken } from "@/server/lib/auth-invite";
import { daadnegar_INVITE_TOKEN_COOKIE } from "@/lib/edyen";
import { routes } from "@/lib/routes";

/** Same rules as GET /api/me: Better Auth session or valid invite token cookie. */
export async function assertPanelAccess() {
  const headerList = await headers();
  const session = await auth.api.getSession({ headers: headerList });
  if (session?.user?.id) return;

  const cookieStore = await cookies();
  const raw = cookieStore.get(daadnegar_INVITE_TOKEN_COOKIE)?.value;
  if (raw) {
    const token = decodeURIComponent(raw);
    const inviteUser = await resolveInviteToken(`Bearer ${token}`);
    if (inviteUser?.userId) return;
  }

  redirect(routes.login);
}
