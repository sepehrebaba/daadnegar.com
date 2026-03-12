import { treaty } from "@elysiajs/eden";
import type { App } from "@/server/app";

export const DADBAN_INVITE_TOKEN_KEY = "dadban_invite_token";

const getBaseUrl = () =>
  typeof window !== "undefined"
    ? window.location.origin
    : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

function getInviteToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(DADBAN_INVITE_TOKEN_KEY);
}

export const api = treaty<App>(getBaseUrl(), {
  fetch: { credentials: "include" },
  headers: () => {
    const token = getInviteToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  },
  fetcher: (url, options) => {
    const token = getInviteToken();
    const headers = new Headers(options?.headers as HeadersInit);
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return fetch(url, { ...options, headers, credentials: "include" });
  },
}).api;
