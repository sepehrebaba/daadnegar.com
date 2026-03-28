import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@/generated/prisma/client";

const poolSize = Math.min(50, Math.max(2, Number(process.env.DATABASE_POOL_SIZE) || 10));

function createAdapter() {
  return new PrismaMariaDb({
    host: process.env.DATABASE_HOST || "127.0.0.1",
    port: Number(process.env.DATABASE_PORT) || 3307,
    user: process.env.DATABASE_USER || "daadnegar",
    password: process.env.DATABASE_PASSWORD || "daadnegar_secret",
    database: process.env.DATABASE_NAME || "daadnegar",
    connectionLimit: poolSize,
  });
}

function createPrismaClient() {
  return new PrismaClient({ adapter: createAdapter() });
}

/** Avoid multiple pools in dev (HMR) — auth and db used to each create a client and hit pool timeouts. */
const globalForPrisma = globalThis as unknown as { daadnegarPrisma?: PrismaClient };
export const prisma = globalForPrisma.daadnegarPrisma ?? createPrismaClient();
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.daadnegarPrisma = prisma;
}
