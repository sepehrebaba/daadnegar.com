import "dotenv/config";
import amqp from "amqplib";
import cron from "node-cron";
import { QUEUE_NAMES, REPORT_SUBMITTED_MESSAGE_TYPE } from "@/lib/rabbitmq";
import { handleReportAssign, handleReportQueueStaleScan } from "./handlers/report-assign";
import { handleSlackNotification } from "./handlers/slack-notification";
import { handleUserReactivation } from "./handlers/user-reactivation";

const RABBITMQ_URL = process.env.RABBITMQ_URL ?? "amqp://guest:guest@localhost:5672";

async function main() {
  const connection = await amqp.connect(RABBITMQ_URL);
  const channel = await connection.createChannel();

  await channel.assertQueue(QUEUE_NAMES.REPORT_SUBMITTED, { durable: true });
  await channel.assertQueue(QUEUE_NAMES.SLACK_NOTIFICATION, { durable: true });

  channel.prefetch(1);

  channel.consume(QUEUE_NAMES.REPORT_SUBMITTED, async (msg) => {
    if (!msg) return;
    try {
      const payload = JSON.parse(msg.content.toString()) as {
        type?: string;
        reportId?: string;
      };
      if (payload.type === REPORT_SUBMITTED_MESSAGE_TYPE.STALE_SCAN) {
        await handleReportQueueStaleScan();
      } else {
        await handleReportAssign(payload.reportId ?? "");
      }
      channel.ack(msg);
    } catch (err) {
      console.error("[worker] report queue error:", err);
      channel.nack(msg, false, true);
    }
  });

  channel.consume(QUEUE_NAMES.SLACK_NOTIFICATION, async (msg) => {
    if (!msg) return;
    try {
      const { webhookUrl, notification } = JSON.parse(msg.content.toString()) as {
        webhookUrl?: string;
        notification?: object;
      };
      if (webhookUrl && notification) {
        await handleSlackNotification(webhookUrl, notification);
      }
      channel.ack(msg);
    } catch (err) {
      console.error("[worker] slack-notification error:", err);
      channel.nack(msg, false, true);
    }
  });

  cron.schedule(
    "* * * * *",
    async () => {
      try {
        await handleUserReactivation();
      } catch (err) {
        console.error("[worker] user-reactivation error:", err);
      }
    },
    { noOverlap: true },
  );

  console.log("[worker] RabbitMQ consumer running. Cron: user-reactivation every minute.");

  process.on("SIGTERM", async () => {
    await channel.close();
    await connection.close();
    process.exit(0);
  });
}

main().catch((err) => {
  console.error("[worker] Fatal:", err);
  process.exit(1);
});
