import { Callback, Context } from "aws-lambda";
import { Chance } from "chance";

export const fakeCallback: Callback = (err, result) => {
  if (err === null || err === undefined) {
    return result;
  }
  return err;
};

export function fakeContext(): Context {
  const context: Context = {
    awsRequestId: new Chance().guid(),
    callbackWaitsForEmptyEventLoop: false,
    functionName: "functionName",
    functionVersion: "functionVersion",
    invokedFunctionArn: "invokedFunctionArn",
    memoryLimitInMB: "memoryLimitInMB",
    logGroupName: "logGroupName",
    logStreamName: "logStreamName",
    getRemainingTimeInMillis: () => 1000,
    done: () => null,
    fail: () => null,
    succeed: () => null,
  };
  return context;
}
