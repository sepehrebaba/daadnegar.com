import type { Language, User } from "@/types";

/** Maps GET /api/me JSON into the client {@link User} shape. */
export function userFromMeApi(data: {
  id: string;
  name?: string | null;
  username?: string;
  inviteCode?: string;
  tokensCount?: number;
  approvedRequestsCount?: number;
  role?: string;
  /** When omitted, defaults to false */
  mustChangePassword?: boolean;
  preferredLanguage?: string | null;
}): User {
  const preferredLanguage: Language = data.preferredLanguage === "en" ? "en" : "fa";
  return {
    id: data.id,
    passkey: "",
    inviteCode: data.inviteCode ?? "",
    isActivated: true,
    tokensCount: data.tokensCount ?? 0,
    approvedRequestsCount: data.approvedRequestsCount ?? 0,
    role: data.role ?? "user",
    username: data.username,
    name: data.name ?? undefined,
    mustChangePassword: data.mustChangePassword ?? false,
    preferredLanguage,
  };
}
