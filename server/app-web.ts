import { constantsService } from "./services/public/constants";
import { sessionSignInService } from "./services/public/session-sign-in";
import { inviteService } from "./services/panel/invite";
import { meService } from "./services/panel/me";
import { peopleService } from "./services/panel/people";
import { reportsService } from "./services/panel/reports";
import { uploadService } from "./services/panel/upload";
import { createBaseElysia, globalHandlers } from "./elysia-base";

/** Public website image: no /api/admin or /api/admin-panel. */
export const app = createBaseElysia()
  .use(globalHandlers)
  .use(constantsService)
  .use(inviteService)
  .use(sessionSignInService)
  .use(meService)
  .use(peopleService)
  .use(reportsService)
  .use(uploadService);

export type App = typeof app;
