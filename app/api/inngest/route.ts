import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import functions from "@/inngest/functions";

export const maxDuration = 300;

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions,
  // Required when Inngest dev server runs in Docker – tells SDK the URL used to reach this app
  serveHost: process.env.INNGEST_SERVE_HOST ?? "http://host.docker.internal:3000",
});
