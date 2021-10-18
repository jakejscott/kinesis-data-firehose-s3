import { Handler } from "aws-lambda";
import { Firehose, _Record } from "@aws-sdk/client-firehose";
import { get } from "env-var";

export type PutEventPayload = {
  userId: string;
  orderId: string;
};

export type PutEventsInput = {
  events: PutEventPayload[];
};

export type PutEventsResult = {
  recordIds: string[];
};

const DELIVERY_STREAM_NAME = get("DELIVERY_STREAM_NAME").required().asString();
const firehose = new Firehose({});

export const handler: Handler<PutEventsInput, PutEventsResult> = async (
  input
) => {
  const records: _Record[] = input.events.map((event) => {
    const record: _Record = {
      Data: Buffer.from(JSON.stringify(event) + "\n"),
    };
    return record;
  });

  const { RequestResponses } = await firehose.putRecordBatch({
    DeliveryStreamName: DELIVERY_STREAM_NAME,
    Records: records,
  });

  const recordIds = RequestResponses
    ? RequestResponses.map((x) => x.RecordId!)
    : [];

  return { recordIds };
};
