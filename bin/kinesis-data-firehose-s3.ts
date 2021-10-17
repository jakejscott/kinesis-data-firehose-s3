#!/usr/bin/env node
import * as cdk from "@aws-cdk/core";
import * as dotenv from "dotenv";
import { get } from "env-var";
import "source-map-support/register";
import { KinesisDataFirehoseS3Stack } from "../lib/kinesis-data-firehose-s3-stack";

const app = new cdk.App();

const { error } = dotenv.config({
  path: ".env",
});

if (error) {
  throw new Error("Make sure you create a `.env` file");
}

const CDK_DEFAULT_ACCOUNT = get("CDK_DEFAULT_ACCOUNT").required().asString();
const CDK_DEFAULT_REGION = get("CDK_DEFAULT_REGION").required().asString();

new KinesisDataFirehoseS3Stack(app, "kinesis-data-firehose-s3", {
  env: {
    account: CDK_DEFAULT_ACCOUNT,
    region: CDK_DEFAULT_REGION,
  },
});
