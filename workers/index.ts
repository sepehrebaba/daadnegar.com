import "dotenv/config";
import amqp from "amqplib";
import { QUEUE_NAMES, REPORT_SUBMITTED_MESSAGE_TYPE } from "@/lib/rabbitmq";
import { handleReportAssign, handleReportQueueStaleScan } from "./handlers/report-assign";
import { handleReportTokenSettlement } from "./handlers/report-token-settlement";
import { handleValidatorDemoted } from "./handlers/validator-demoted";

const RABBITMQ_URL = process.env.RABBITMQ_URL ?? "amqp://guest:guest@localhost:5672";

async function main() {
  console.log(
    "[worker] Connecting to RabbitMQ at",
    RABBITMQ_URL.replace(/\/\/.*@/, "//<credentials>@"),
  );
  const connection = await amqp.connect(RABBITMQ_URL);
  console.log("[worker] Connected to RabbitMQ");

  const channel = await connection.createChannel();

  await channel.assertQueue(QUEUE_NAMES.REPORT_SUBMITTED, { durable: true });
  await channel.assertQueue(QUEUE_NAMES.SLACK_NOTIFICATION, { durable: true });
  await channel.assertQueue(QUEUE_NAMES.REPORT_TOKEN_SETTLEMENT, { durable: true });
  await channel.assertQueue(QUEUE_NAMES.VALIDATOR_DEMOTED, { durable: true });
  console.log("[worker] Queues asserted:", Object.values(QUEUE_NAMES).join(", "));

  void channel.prefetch(1);

  void channel.consume(QUEUE_NAMES.REPORT_SUBMITTED, async (msg) => {
    if (!msg) return;
    const raw = msg.content.toString();
    console.log("[worker] Picked message from %s: %s", QUEUE_NAMES.REPORT_SUBMITTED, raw);
    const start = Date.now();
    try {
      const payload = JSON.parse(raw) as {
        type?: string;
        reportId?: string;
      };
      if (payload.type === REPORT_SUBMITTED_MESSAGE_TYPE.STALE_SCAN) {
        console.log("[worker] Handling stale scan...");
        await handleReportQueueStaleScan();
      } else {
        console.log("[worker] Handling report assign for reportId=%s", payload.reportId);
        await handleReportAssign(payload.reportId ?? "");
      }
      channel.ack(msg);
      console.log(
        "[worker] Acked message from %s (took %dms)",
        QUEUE_NAMES.REPORT_SUBMITTED,
        Date.now() - start,
      );
    } catch (err) {
      console.error("[worker] report queue error (took %dms):", Date.now() - start, err);
      channel.nack(msg, false, true);
      console.warn(
        "[worker] Nacked message from %s — will be requeued",
        QUEUE_NAMES.REPORT_SUBMITTED,
      );
    }
  });

  void channel.consume(QUEUE_NAMES.REPORT_TOKEN_SETTLEMENT, async (msg) => {
    if (!msg) return;
    const raw = msg.content.toString();
    console.log("[worker] Picked message from %s: %s", QUEUE_NAMES.REPORT_TOKEN_SETTLEMENT, raw);
    const start = Date.now();
    try {
      const payload = JSON.parse(raw) as { reportId?: string };
      console.log("[worker] Handling token settlement for reportId=%s", payload.reportId);
      await handleReportTokenSettlement(payload.reportId ?? "");
      channel.ack(msg);
      console.log(
        "[worker] Acked message from %s (took %dms)",
        QUEUE_NAMES.REPORT_TOKEN_SETTLEMENT,
        Date.now() - start,
      );
    } catch (err) {
      console.error("[worker] report token settlement error (took %dms):", Date.now() - start, err);
      channel.nack(msg, false, true);
      console.warn(
        "[worker] Nacked message from %s — will be requeued",
        QUEUE_NAMES.REPORT_TOKEN_SETTLEMENT,
      );
    }
  });

  void channel.consume(QUEUE_NAMES.VALIDATOR_DEMOTED, async (msg) => {
    if (!msg) return;
    const raw = msg.content.toString();
    console.log("[worker] Picked message from %s: %s", QUEUE_NAMES.VALIDATOR_DEMOTED, raw);
    const start = Date.now();
    try {
      const payload = JSON.parse(raw) as { validatorId?: string };
      console.log("[worker] Handling validator demoted for validatorId=%s", payload.validatorId);
      await handleValidatorDemoted(payload.validatorId ?? "");
      channel.ack(msg);
      console.log(
        "[worker] Acked message from %s (took %dms)",
        QUEUE_NAMES.VALIDATOR_DEMOTED,
        Date.now() - start,
      );
    } catch (err) {
      console.error("[worker] validator demoted error (took %dms):", Date.now() - start, err);
      channel.nack(msg, false, true);
      console.warn(
        "[worker] Nacked message from %s — will be requeued",
        QUEUE_NAMES.VALIDATOR_DEMOTED,
      );
    }
  });

  console.log("[worker] All consumers registered. Waiting for messages...");

  process.on("SIGTERM", async () => {
    console.log("[worker] SIGTERM received, shutting down gracefully...");
    await channel.close();
    await connection.close();
    console.log("[worker] Disconnected from RabbitMQ. Exiting.");
    process.exit(0);
  });
}

main().catch((err) => {
  console.error("[worker] Fatal:", err);
  process.exit(1);
});
