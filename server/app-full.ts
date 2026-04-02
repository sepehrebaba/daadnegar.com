import { constantsService } from "./services/public/constants";
import { sessionSignInService } from "./services/public/session-sign-in";
import { inviteService } from "./services/panel/invite";
import { meService } from "./services/panel/me";
import { peopleService } from "./services/panel/people";
import { reportsService } from "./services/panel/reports";
import { uploadService } from "./services/panel/upload";
import { internalCronService } from "./services/internal-cron";
import { adminPanelAuthService } from "./services/admin/auth";
import { adminService } from "./services/admin/service";
import { createBaseElysia, globalHandlers } from "./elysia-base";

/** Local / default: full API surface (public app + admin). */
export const app = createBaseElysia()
  .use(globalHandlers)
  .use(constantsService)
  .use(inviteService)
  .use(sessionSignInService)
  .use(meService)
  .use(peopleService)
  .use(reportsService)
  .use(internalCronService)
  .use(adminPanelAuthService)
  .use(adminService)
  .use(uploadService);

export type App = typeof app;
