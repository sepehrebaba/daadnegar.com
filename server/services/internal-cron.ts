import { Elysia } from "elysia";
import { publishReportQueueStaleScan } from "@/lib/rabbitmq";
import { timingSafeEqual } from "node:crypto";

function timingSafeEqualString(a: string, b: string): boolean {
  const aBuf = Buffer.from(a, "utf8");
  const bBuf = Buffer.from(b, "utf8");
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

/**
 * Machine-to-machine routes (Kubernetes CronJob, etc.).
 * POST publishes to RabbitMQ; workers run `scanAndReassignStaleReports`.
 */
export const internalCronService = new Elysia({
  name: "internalCron",
  prefix: "/internal",
  aot: false,
}).post("/report-queue-stale-scan", async ({ request, set }) => {
  const secret = process.env.CRON_SECRET ?? "";
  if (!secret) {
    set.status = 503;
    return { ok: false, error: "CRON_SECRET is not set" };
  }
  const auth = request.headers.get("authorization");
  const bearer = auth?.startsWith("Bearer ") ? auth.slice(7).trim() : null;
  const headerSecret = request.headers.get("x-cron-secret");
  const token = bearer ?? headerSecret ?? "";
  if (!timingSafeEqualString(token, secret)) {
    set.status = 401;
    return { ok: false, error: "Unauthorized" };
  }
  const published = await publishReportQueueStaleScan();
  return { ok: true, published };
});
