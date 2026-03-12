import { Elysia } from "elysia";
import { constantsService } from "./services/constants";
import { inviteService } from "./services/invite";
import { meService } from "./services/me";
import { reportsService } from "./services/reports";
import { peopleService } from "./services/people";
import { adminService } from "./services/admin";
import { adminPanelAuthService } from "./services/admin-panel-auth";
import { DefaultContext, type Generator, rateLimit } from "elysia-rate-limit";
import { elysiaHelmet } from "elysiajs-helmet";
import { ip } from "elysia-ip";
import { cors } from "@elysiajs/cors";
import { serverTiming } from "@elysiajs/server-timing";

const ipGenerator: Generator<{ ip: { address: string } }> = (_r, _s, { ip }) =>
  ip?.address ?? "unknown";

export const app = new Elysia({ prefix: "/api", aot: false })
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
        console.error("Error occurred after trace", error, { duration: end - begin });
      });
    });
  })
  .use(
    elysiaHelmet({
      hsts: {
        maxAge: 31_536_000,
        includeSubDomains: true,
        preload: true,
      },
      frameOptions: "DENY",
      referrerPolicy: "strict-origin-when-cross-origin",
    }),
  )
  .use(ip())
  .use(
    serverTiming({
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
    }),
  )
  // --- CORS configuration for cross-origin requests ---
  .use(
    cors({
      origin: process.env.FRONTEND_URL || "http://localhost:3000", // Configurable frontend URL
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"], // Specify allowed headers
      credentials: true, // Allow credentials (e.g., cookies, authorization headers)
      maxAge: 86_400, // Cache the preflight response for 24 hours
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
  )
  .use(constantsService)
  .use(inviteService)
  .use(meService)
  .use(peopleService)
  .use(reportsService)
  .use(adminPanelAuthService)
  .use(adminService)
  .get("/health", () => ({ status: "ok", timestamp: new Date().toISOString() }))

  .onError(
    /**
     * Global error handler for the API.
     * Logs the error and returns a JSON error response.
     */
    ({ code, error, set }) => {
      const err = error instanceof Error ? error : new Error(String(error));
      const message = err.message;
      const name = err.name;
      console.error("API error handler", { name, message, code });
      set.status = code === "NOT_FOUND" ? 404 : 500;
      return JSON.stringify({
        error: { name, message },
        status: set.status,
      });
    },
  );

export type App = typeof app;
