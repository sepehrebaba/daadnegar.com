import { constantsService } from "./services/constants";
import { inviteService } from "./services/invite";
import { meService } from "./services/me";
import { sessionSignInService } from "./services/session-sign-in";
import { reportsService } from "./services/reports";
import { peopleService } from "./services/people";
import { uploadService } from "./services/upload";
import { createBaseElysia, withGlobalHandlers } from "./elysia-base";

/** Public website image: no /api/admin or /api/admin-panel. */
export const app = withGlobalHandlers(
  createBaseElysia()
    .use(constantsService)
    .use(inviteService)
    .use(sessionSignInService)
    .use(meService)
    .use(peopleService)
    .use(reportsService)
    .use(uploadService),
);

export type App = typeof app;
