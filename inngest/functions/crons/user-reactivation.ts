import { inngest } from "../../client";
import { prisma } from "@/server/db";
import dayjs from "dayjs";

// This Cron handles locked user re-activation after a certain number of hours
// If you enter your password wrong 3 times, your account will be locked for 3 hours
// If you keep entering your password wrong, the lock will extend by 1 hour for each wrong attempt
// Therefore, E.g: If you enter your password wrong 10 times, your account will be locked for 10 hours

export const userReactivation = inngest.createFunction(
  { id: "user-reactivation" },
  { cron: "* * * * *" },
  async ({ step }) => {
    await step.run("fetch-and-check-users", async () => {
      const users = await prisma.user.findMany({
        where: {
          status: "SUSPENDED",
          passwordLockedAt: {
            not: null,
          },
        },
        select: {
          id: true,
          passwordLockedAt: true,
          passwordRetryCount: true,
        },
      });

      for (const user of users) {
        const now = dayjs();
        const lockDateAfterRetryHours = dayjs(user.passwordLockedAt).add(
          user.passwordRetryCount || 3,
          "hours",
        );

        if (now.isAfter(lockDateAfterRetryHours)) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              status: "ACTIVE",
              passwordLockedAt: null,
              passwordRetryCount: 0,
            },
          });
        }
      }
    });
  },
);
