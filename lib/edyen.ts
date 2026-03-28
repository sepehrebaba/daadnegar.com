import { treaty } from "@elysiajs/eden";
import type { App } from "@/server/app";
import { getAppBaseUrl } from "@/lib/app-base-url";

export const DAADNEGAR_INVITE_TOKEN_KEY = "daadnegar_invite_token";
export const daadnegar_INVITE_TOKEN_COOKIE = "daadnegar_invite_token";

/** Sets invite token in both localStorage and cookie (for middleware auth check). */
export function setInviteTokenStorage(token: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(DAADNEGAR_INVITE_TOKEN_KEY, token);
  document.cookie = `${daadnegar_INVITE_TOKEN_COOKIE}=${encodeURIComponent(token)}; path=/; max-age=31536000; samesite=strict`;
}

/** Clears invite token from both localStorage and cookie. */
export function clearInviteTokenStorage() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(DAADNEGAR_INVITE_TOKEN_KEY);
  document.cookie = `${daadnegar_INVITE_TOKEN_COOKIE}=; path=/; max-age=0`;
}

function getInviteToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(DAADNEGAR_INVITE_TOKEN_KEY);
}

export const api = treaty<App>(getAppBaseUrl(), {
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

/** Secure file upload (strip metadata, store in MinIO) for report documents */
export async function uploadReportFile(file: File): Promise<{ key: string; name: string }> {
  const token = getInviteToken();
  const base = getAppBaseUrl();
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${base}/api/upload`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: "include",
    body: form,
  });
  if (!res.ok) {
    const text = await res.text();
    let errMsg = "خطا در آپلود فایل";
    try {
      const j = JSON.parse(text);
      if (j?.error?.message) errMsg = j.error.message;
    } catch {
      if (text) errMsg = text;
    }
    throw new Error(errMsg);
  }
  const data = (await res.json()) as { key: string; name: string };
  return data;
}

/** Fetch pending report detail (for validators) */
export async function getPendingReportDetail(id: string) {
  const token = getInviteToken();
  const base = getAppBaseUrl();
  const res = await fetch(`${base}/api/reports/pending/${id}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: "include",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "خطا در دریافت گزارش");
  }
  return res.json();
}
