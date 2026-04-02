import { Elysia, t } from "elysia";
import { prisma } from "../db";

export const logsService = new Elysia({ prefix: "/logs" }).get(
  "/",
  async ({ params, query }) => {
    const where: Record<string, unknown> = { workspaceId: params.workspaceId };
    if (query.service) where.service = query.service;
    if (query.level) where.level = query.level;
    if (query.repo) where.repoName = query.repo;
    if (query.search) {
      where.message = { contains: query.search, mode: "insensitive" };
    }

    const page = Number(query.page ?? 1);
    const perPage = Number(query.perPage ?? 25);
    const skip = (page - 1) * perPage;

    const [data, total] = await Promise.all([
      prisma.logEntry.findMany({
        where,
        orderBy: { timestamp: "desc" },
        skip,
        take: perPage,
      }),
      prisma.logEntry.count({ where }),
    ]);

    return { data, total, page, perPage };
  },
  {
    query: t.Object({
      service: t.Optional(t.String()),
      level: t.Optional(t.String()),
      repo: t.Optional(t.String()),
      search: t.Optional(t.String()),
      page: t.Optional(t.String()),
      perPage: t.Optional(t.String()),
      workspaceId: t.Optional(t.String()),
    }),
  },
);
