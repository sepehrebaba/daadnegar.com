import { Elysia } from "elysia";
import { prisma } from "../db";
import { getSettingBool, SETTING_KEYS } from "../lib/settings";

export const constantsService = new Elysia({ prefix: "/constants" })
  .get("/reports-enabled", async () => {
    const enabled = await getSettingBool(SETTING_KEYS.REPORTS_ENABLED);
    return { enabled };
  })
  .get("/categories", async () => {
    const categories = await prisma.category.findMany({
      where: { isActive: true, parentId: null },
      include: {
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { sortOrder: "asc" },
    });
    return categories;
  })
  .get("/provinces", async () => {
    const provinces = await prisma.province.findMany({
      include: {
        cities: { orderBy: { sortOrder: "asc" } },
      },
      orderBy: { sortOrder: "asc" },
    });
    return provinces;
  })
  .get("/invite-codes", async () => {
    const codes = await prisma.inviteCode.findMany({
      where: { isActive: true },
    });
    return codes.map((c) => ({ code: c.code, isActive: c.isActive }));
  });
