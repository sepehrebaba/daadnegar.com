import amqp, { Channel, Connection } from "amqplib";

const RABBITMQ_URL = process.env.RABBITMQ_URL ?? "amqp://guest:guest@localhost:5672";

let connection: Connection | null = null;
let channel: Channel | null = null;

function resetConnection(): void {
  connection = null;
  channel = null;
}

function logConnectionError(err: unknown): void {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg === "Heartbeat timeout") {
    console.warn("[rabbitmq] Connection dropped (heartbeat); will reconnect on the next publish.");
    return;
  }
  console.error("[rabbitmq] Connection error:", err);
}

export const QUEUE_NAMES = {
  REPORT_SUBMITTED: "report.submitted",
  SLACK_NOTIFICATION: "slack.notification",
  REPORT_TOKEN_SETTLEMENT: "report.token_settlement",
  VALIDATOR_DEMOTED: "validator.demoted",
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
    logConnectionError(err);
    resetConnection();
  });
  channel.on("error", (err) => {
    console.error("[rabbitmq] Channel error:", err);
    resetConnection();
  });
  connection.on("close", () => {
    resetConnection();
  });
  return channel;
}

/**
 * Publish a message to a queue. Safe to call - returns false if RabbitMQ is unavailable.
 */
export async function publish(queueName: string, message: object): Promise<boolean> {
  const attempt = async (): Promise<boolean> => {
    const ch = await getChannel();
    await ch.assertQueue(queueName, { durable: true });
    return ch.sendToQueue(queueName, Buffer.from(JSON.stringify(message)), {
      persistent: true,
    });
  };
  try {
    return await attempt();
  } catch (err) {
    console.error("[rabbitmq] Publish failed:", err);
    resetConnection();
    try {
      return await attempt();
    } catch (err2) {
      console.error("[rabbitmq] Publish failed after reconnect:", err2);
      return false;
    }
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

export async function publishReportTokenSettlement(reportId: string): Promise<boolean> {
  return publish(QUEUE_NAMES.REPORT_TOKEN_SETTLEMENT, { reportId });
}

/**
 * Published when a validator is demoted to a normal user or deactivated — in-review reports must be reassigned.
 */
export async function publishValidatorDemoted(validatorId: string): Promise<boolean> {
  return publish(QUEUE_NAMES.VALIDATOR_DEMOTED, { validatorId });
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
    resetConnection();
  }
}
