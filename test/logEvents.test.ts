import { Lambda, LogType } from "@aws-sdk/client-lambda";
import { Chance } from "chance";
import { get } from "env-var";
import * as outputs from "../outputs.json";
import { handler, LogEventsInput } from "../src/logEvents";
import { fakeCallback, fakeContext } from "./fakes";
describe("logEvents lambda", () => {
  it("invoke log event lambda", async () => {
    const region = get("CDK_DEFAULT_REGION").required().asString();
    const lambda = new Lambda({ region: region });
    const chance = new Chance();

    const orderId = chance.guid();
    const userId = chance.guid();

    const event: LogEventsInput = {
      events: [
        {
          eventType: "order-pending",
          orderId: orderId,
          userId: userId,
        },
        {
          eventType: "order-processing",
          orderId: orderId,
          userId: userId,
        },
        {
          eventType: "order-success",
          orderId: orderId,
          userId: userId,
        },
      ],
    };

    const functionName = (outputs as any)["kinesis-data-firehose-s3"]
      .LogEventsFunctionName;

    const { LogResult } = await lambda.invoke({
      FunctionName: functionName,
      Payload: Buffer.from(JSON.stringify(event)),
      LogType: LogType.Tail,
    });

    console.log("logs: \n", LogResult);

    const context = fakeContext();
    await handler(event, context, fakeCallback);
  });
});
