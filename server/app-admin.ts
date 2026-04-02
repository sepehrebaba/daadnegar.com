import { constantsService } from "./services/public/constants";
import { adminPanelAuthService } from "./services/admin/auth";
import { adminService } from "./services/admin/service";
import { uploadService } from "./services/panel/upload";
import { createBaseElysia, globalHandlers } from "./elysia-base";

/** Admin-only image: panel auth + admin API + uploads (URLs for reports, etc.). */
export const app = createBaseElysia()
  .use(globalHandlers)
  .use(constantsService)
  .use(adminPanelAuthService)
  .use(adminService)
  .use(uploadService);

export type App = typeof app;
