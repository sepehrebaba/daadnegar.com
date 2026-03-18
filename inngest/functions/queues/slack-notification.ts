import { inngest } from "../../client";

export const slackNotificationSender = inngest.createFunction(
  { id: "slack-notification-sender" },
  { event: "app/slack-notification.send" },
  async ({ step, event }) => {
    await step.run("send-slack-notification", async () => {
      await fetch(event.data.webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(event.data.notification),
      });
    });
  },
);
