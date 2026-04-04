import { Elysia } from "elysia";
import { adminGuard, resolveAdminAuth } from "./shared";
import { adminSettingsRoutes } from "./settings";
import { adminCategoriesRoutes } from "./categories";
import { adminGeoRoutes } from "./geo";
import { adminUsersRoutes } from "./users";
import { adminPeopleRoutes } from "./people";
import { adminReportsRoutes } from "./reports";
import { adminPanelRoutes } from "./panel";

export const adminService = new Elysia({ prefix: "/admin" })
  .use(adminGuard)
  .get("/me", () => ({ ok: true }))
  .use(adminSettingsRoutes)
  .use(adminCategoriesRoutes)
  .use(adminGeoRoutes)
  .use(adminUsersRoutes)
  .use(adminPeopleRoutes)
  .use(adminReportsRoutes)
  .use(adminPanelRoutes);

export type { AdminAuth } from "./shared";
export { adminGuard, getAuditCtx, mapReportDocuments, resolveAdminAuth } from "./shared";
