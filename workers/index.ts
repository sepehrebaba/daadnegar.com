import "dotenv/config";
import amqp from "amqplib";
import { QUEUE_NAMES, REPORT_SUBMITTED_MESSAGE_TYPE } from "@/lib/rabbitmq";
import { handleReportAssign, handleReportQueueStaleScan } from "./handlers/report-assign";
import { handleReportTokenSettlement } from "./handlers/report-token-settlement";

const RABBITMQ_URL = process.env.RABBITMQ_URL ?? "amqp://guest:guest@localhost:5672";

async function main() {
  const connection = await amqp.connect(RABBITMQ_URL);
  const channel = await connection.createChannel();

  await channel.assertQueue(QUEUE_NAMES.REPORT_SUBMITTED, { durable: true });
  await channel.assertQueue(QUEUE_NAMES.SLACK_NOTIFICATION, { durable: true });
  await channel.assertQueue(QUEUE_NAMES.REPORT_TOKEN_SETTLEMENT, { durable: true });

  void channel.prefetch(1);

  void channel.consume(QUEUE_NAMES.REPORT_SUBMITTED, async (msg) => {
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

  void channel.consume(QUEUE_NAMES.REPORT_TOKEN_SETTLEMENT, async (msg) => {
    if (!msg) return;
    try {
      const payload = JSON.parse(msg.content.toString()) as { reportId?: string };
      await handleReportTokenSettlement(payload.reportId ?? "");
      channel.ack(msg);
    } catch (err) {
      console.error("[worker] report token settlement error:", err);
      channel.nack(msg, false, true);
    }
  });

  console.log("[worker] RabbitMQ consumers running (report queue + token settlement).");

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
