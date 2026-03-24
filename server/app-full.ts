import { constantsService } from "./services/constants";
import { inviteService } from "./services/invite";
import { meService } from "./services/me";
import { sessionSignInService } from "./services/session-sign-in";
import { reportsService } from "./services/reports";
import { peopleService } from "./services/people";
import { adminService } from "./services/admin";
import { adminPanelAuthService } from "./services/admin-panel-auth";
import { uploadService } from "./services/upload";
import { internalCronService } from "./services/internal-cron";
import { createBaseElysia, withGlobalHandlers } from "./elysia-base";

/** Local / default: full API surface (public app + admin). */
export const app = withGlobalHandlers(
  createBaseElysia()
    .use(constantsService)
    .use(inviteService)
    .use(sessionSignInService)
    .use(meService)
    .use(peopleService)
    .use(reportsService)
    .use(internalCronService)
    .use(adminPanelAuthService)
    .use(adminService)
    .use(uploadService),
);

export type App = typeof app;
