/**
 * Stable Eden treaty type source — never swapped by the Dockerfile.
 * Always exports the full App type so components outside each image's
 * removed directories (app/admin, app/(public-website), etc.) still
 * type-check correctly against the complete API surface.
 */
export type { App } from "./app-full";
