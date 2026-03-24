import amqp, { Channel, Connection } from "amqplib";

const RABBITMQ_URL = process.env.RABBITMQ_URL ?? "amqp://guest:guest@localhost:5672";

let connection: Connection | null = null;
let channel: Channel | null = null;

export const QUEUE_NAMES = {
  REPORT_SUBMITTED: "report.submitted",
  SLACK_NOTIFICATION: "slack.notification",
} as const;

/** Payload shape on `report.submitted`: new report vs periodic SLA scan (CronJob → worker). */
export const REPORT_SUBMITTED_MESSAGE_TYPE = {
  STALE_SCAN: "stale_scan",
} as const;

async function getChannel(): Promise<Channel> {
  if (channel?.connection) return channel;
  connection = await amqp.connect(RABBITMQ_URL);
  channel = await connection.createChannel();
  connection.on("error", (err) => {
    console.error("[rabbitmq] Connection error:", err);
  });
  connection.on("close", () => {
    connection = null;
    channel = null;
  });
  return channel;
}

/**
 * Publish a message to a queue. Safe to call - returns false if RabbitMQ is unavailable.
 */
export async function publish(queueName: string, message: object): Promise<boolean> {
  try {
    const ch = await getChannel();
    await ch.assertQueue(queueName, { durable: true });
    const ok = ch.sendToQueue(queueName, Buffer.from(JSON.stringify(message)), {
      persistent: true,
    });
    return ok;
  } catch (err) {
    console.error("[rabbitmq] Publish failed:", err);
    return false;
  }
}

/**
 * Publish report.submitted event.
 */
export async function publishReportSubmitted(reportId: string): Promise<boolean> {
  return publish(QUEUE_NAMES.REPORT_SUBMITTED, { reportId });
}

/** Kubernetes CronJob (or scheduler) calls the internal HTTP route, which publishes this; worker runs SLA scan. */
export async function publishReportQueueStaleScan(): Promise<boolean> {
  return publish(QUEUE_NAMES.REPORT_SUBMITTED, {
    type: REPORT_SUBMITTED_MESSAGE_TYPE.STALE_SCAN,
  });
}

/**
 * Publish slack notification event.
 */
export async function publishSlackNotification(
  webhookUrl: string,
  notification: object,
): Promise<boolean> {
  return publish(QUEUE_NAMES.SLACK_NOTIFICATION, {
    webhookUrl,
    notification,
  });
}

/**
 * Close connection (for graceful shutdown).
 */
export async function close(): Promise<void> {
  try {
    if (channel) await channel.close();
    if (connection) await connection.close();
  } finally {
    channel = null;
    connection = null;
  }
}
