import { constantsService } from "./services/constants";
import { adminService } from "./services/admin";
import { adminPanelAuthService } from "./services/admin-panel-auth";
import { uploadService } from "./services/upload";
import { createBaseElysia, withGlobalHandlers } from "./elysia-base";

/** Admin-only image: panel auth + admin API + uploads (URLs for reports, etc.). */
export const app = withGlobalHandlers(
  createBaseElysia()
    .use(constantsService)
    .use(adminPanelAuthService)
    .use(adminService)
    .use(uploadService),
);

export type App = typeof app;
