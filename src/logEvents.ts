import { Handler } from "aws-lambda";
import pino, { PinoLambdaLogger } from "pino-lambda";

export type LogEventPayload = {
  userId: string;
  orderId: string;
  eventType: string;
};

export type LogEventsInput = {
  events: LogEventPayload[];
};

const log: PinoLambdaLogger = pino({});

export const handler: Handler<LogEventsInput, void> = async (
  input,
  context
) => {
  log.withRequest(input, context);
  for (const event of input.events) {
    const auditEvent = {
      ts: new Date().toISOString(),
      ...event,
    };
    log.info(auditEvent, "AUDIT");
  }
};
