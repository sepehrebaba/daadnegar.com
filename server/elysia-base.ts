import { Elysia } from "elysia";
import { DefaultContext, type Generator, rateLimit } from "elysia-rate-limit";
import { elysiaHelmet } from "elysiajs-helmet";
import { ip } from "elysia-ip";
import { cors } from "@elysiajs/cors";
import { serverTiming } from "@elysiajs/server-timing";
import { opentelemetry } from "@elysiajs/opentelemetry";

const ipGenerator: Generator<{ ip: { address: string } }> = (_r, _s, { ip }) =>
  ip?.address ?? "unknown";

/** Shared middleware stack for all API bundles (public web, admin-only, full dev). */
export function createBaseElysia() {
  return new Elysia({ prefix: "/api", aot: false })
    .trace(async ({ onBeforeHandle, onAfterHandle, onError }) => {
      onBeforeHandle(({ begin, onStop }) => {
        onStop(({ end }) => {
          console.info("BeforeHandle took", { duration: end - begin });
        });
      });
      onAfterHandle(({ begin, onStop }) => {
        onStop(({ end }) => {
          console.info("AfterHandle took", { duration: end - begin });
        });
      });
      onError(({ begin, onStop }) => {
        onStop(({ end, error }) => {
          console.error("Error occurred after trace", error, {
            duration: end - begin,
          });
        });
      });
    })
    .use(
      opentelemetry({
        // NodeSDK reads OTEL_EXPORTER_OTLP_* / OTEL_TRACES_EXPORTER / OTEL_SDK_DISABLED from the environment.
        serviceName: process.env.OTEL_SERVICE_NAME ?? "daadnegar-api",
      }),
    )
    .use(
      elysiaHelmet({
        hsts: {
          maxAge: 31_536_000,
          includeSubDomains: true,
          preload: true,
        },
        frameOptions: "DENY",
        referrerPolicy: "strict-origin-when-cross-origin",
        csp: {
          defaultSrc: ["'none'"],
          baseUri: ["'none'"],
          objectSrc: ["'none'"],
        },
      }),
    )
    .use(ip())
    .use(
      serverTiming(
        process.env.NODE_ENV === "production"
          ? { enabled: false }
          : {
              trace: {
                request: true,
                parse: true,
                transform: true,
                beforeHandle: true,
                handle: true,
                afterHandle: true,
                error: true,
                mapResponse: true,
                total: true,
              },
            },
      ),
    )
    .use(
      cors({
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true,
        maxAge: 86_400,
      }),
    )
    .use(
      rateLimit({
        duration: 60_000,
        max: 100,
        headers: true,
        scoping: "scoped",
        countFailedRequest: true,
        errorResponse: new Response(
          JSON.stringify({
            error: "Too many requests",
          }),
          { status: 429 },
        ),
        generator: ipGenerator,
        context: new DefaultContext(10_000),
      }),
    );
}

export const globalHandlers = new Elysia()
  .get("/health", () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
  }))
  .onError(({ code, error, set }) => {
    const msg = (error as any).response;
    const err = error instanceof Error ? error : new Error(String(error));
    const message = msg || err.message;
    const name = err.name;
    console.error("API error handler", {
      name,
      message,
      code,
      stack: err.stack,
    });
    set.status =
      code === "NOT_FOUND"
        ? 404
        : err.message === "Unauthorized"
          ? 401
          : err.message === "MUST_CHANGE_PASSWORD"
            ? 403
            : 500;

    set.headers["Content-Type"] = "application/json; charset=utf-8";

    if (code === "VALIDATION") return error.detail(error.message);

    if (err.message === "Unauthorized") {
      return {
        error: { name: "Unauthorized", message: "Unauthorized" },
        status: 401,
      };
    }

    if (code === "NOT_FOUND") {
      return {
        error: { name: "NotFound", message: "Not Found" },
        status: 404,
      };
    }

    if (err.message === "MUST_CHANGE_PASSWORD") {
      return {
        error: {
          name: "Forbidden",
          message: "برای ادامه باید رمز عبور خود را تغییر دهید.",
          code: "MUST_CHANGE_PASSWORD",
        },
        status: 403,
        code,
      };
    }

    return {
      error: {
        name: "InternalServerError",
        message: "An unexpected error occurred.",
      },
      status: 500,
    };
  });
