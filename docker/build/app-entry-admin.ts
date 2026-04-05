/** Copied to `server/app.ts` during Docker build (sits next to `app-admin.ts`). */
// @ts-ignore — relative import is valid only after `cp` into `server/` (see Dockerfile)
export { app, type App } from "./app-admin";
