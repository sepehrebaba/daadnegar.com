import { Elysia, t } from "elysia";
import { prisma } from "../db";

const paramsBody = t.Object({
  workspaceId: t.String(),
  userId: t.String(),
});

export const membershipService = new Elysia({ prefix: "/membership" }).get(
  "/:userId",
  async ({ params }) => {
    const memberships = await prisma.workspaceMember.findMany({
      where: { workspaceId: params.workspaceId, userId: params.userId },
    });
    return memberships;
  },
  { params: paramsBody },
);
