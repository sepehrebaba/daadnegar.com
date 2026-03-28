import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formats a number with Persian digits (fa-IR locale). */
export function toPersianNum(n: number): string {
  return n.toLocaleString("fa-IR");
}

/** Relative time in Persian: now, N minutes ago, N hours ago, etc. */
export function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const sec = Math.floor((now.getTime() - date.getTime()) / 1000);
  const n = (v: number) => v.toLocaleString("fa-IR");

  if (sec < 60) return "الان";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${n(min)} دقیقه پیش`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${n(hr)} ساعت پیش`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${n(day)} روز پیش`;
  const week = Math.floor(day / 7);
  if (week < 4) return `${n(week)} هفته پیش`;
  const month = Math.floor(day / 30);
  if (month < 12) return `${n(month)} ماه پیش`;
  const year = Math.floor(day / 365);
  return `${n(year)} سال پیش`;
}
