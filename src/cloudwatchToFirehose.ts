import { Firehose, _Record } from "@aws-sdk/client-firehose";
import { CloudWatchLogsDecodedData, CloudWatchLogsHandler } from "aws-lambda";
import { get } from "env-var";
import pino, { PinoLambdaLogger } from "pino-lambda";
import { gunzipSync } from "zlib";

const DELIVERY_STREAM_NAME = get("DELIVERY_STREAM_NAME").required().asString();
const log: PinoLambdaLogger = pino({});
const firehose = new Firehose({});

export const handler: CloudWatchLogsHandler = async (input) => {
  var compressed = Buffer.from(input.awslogs.data, "base64");
  const result = gunzipSync(compressed).toString("utf8");
  const data: CloudWatchLogsDecodedData = JSON.parse(result);

  const records: _Record[] = [];

  if (data.messageType == "DATA_MESSAGE") {
    for (const logEvent of data.logEvents) {
      const index = logEvent.message.indexOf("{");

      if (index > 0) {
        try {
          const raw = logEvent.message.substring(index);
          const json = JSON.parse(raw);

          if (json.msg == "AUDIT") {
            const record: _Record = {
              Data: Buffer.from(JSON.stringify(json) + "\n"),
            };
            records.push(record);
          } else {
            console.error("msg != AUDIT");
          }
        } catch (error) {
          log.error({ error }, "parse error");
        }
      }
    }
  }

  await firehose.putRecordBatch({
    DeliveryStreamName: DELIVERY_STREAM_NAME,
    Records: records,
  });
};
