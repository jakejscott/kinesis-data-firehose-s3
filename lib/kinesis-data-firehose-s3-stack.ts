import * as kinesisfirehose from "@aws-cdk/aws-kinesisfirehose";
import * as destinations from "@aws-cdk/aws-kinesisfirehose-destinations";
import * as lambda from "@aws-cdk/aws-lambda";
import * as lambdanodejs from "@aws-cdk/aws-lambda-nodejs";
import * as logs from "@aws-cdk/aws-logs";
import * as logsdestinations from "@aws-cdk/aws-logs-destinations";
import * as s3 from "@aws-cdk/aws-s3";
import * as cdk from "@aws-cdk/core";
import { CfnOutput } from "@aws-cdk/core";

export class KinesisDataFirehoseS3Stack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    //
    // logEvent lambda logs to -> cloudwatch -> cloudwatch logs filter -> cloudwatchToFirehose lambda -> kinesis firehose
    //

    const s3DestinationBucket = new s3.Bucket(this, "S3DestinationBucket", {
      versioned: true,
    });

    const s3DestinationLogGroup = new logs.LogGroup(
      this,
      "S3DestinationLogGroup"
    );

    const s3Destination = new destinations.S3Bucket(s3DestinationBucket, {
      logging: true,
      logGroup: s3DestinationLogGroup,
      bufferingInterval: cdk.Duration.seconds(60),
      bufferingSize: cdk.Size.mebibytes(64),
      compression: undefined,
      dataOutputPrefix:
        "userid=!{partitionKeyFromQuery:userid}/year=!{timestamp:yyyy}/month=!{timestamp:MM}/day=!{timestamp:dd}/hour=!{timestamp:HH}/",
      errorOutputPrefix:
        "failed/!{firehose:error-output-type}/year=!{timestamp:yyyy}/month=!{timestamp:MM}/day=!{timestamp:dd}/hour=!{timestamp:HH}/",
    });

    const s3DeliveryStream = new kinesisfirehose.DeliveryStream(
      this,
      "S3DeliveryStream",
      {
        destinations: [s3Destination],
      }
    );

    const s3DeliveryStreamEscapeHatch = s3DeliveryStream.node
      .defaultChild as kinesisfirehose.CfnDeliveryStream;

    s3DeliveryStreamEscapeHatch.addPropertyOverride(
      "ExtendedS3DestinationConfiguration.DynamicPartitioningConfiguration",
      {
        Enabled: true,
        RetryOptions: {
          DurationInSeconds: 300,
        },
      }
    );

    s3DeliveryStreamEscapeHatch.addPropertyOverride(
      "ExtendedS3DestinationConfiguration.ProcessingConfiguration",
      {
        Enabled: true,
        Processors: [
          {
            Type: "MetadataExtraction",
            Parameters: [
              {
                ParameterName: "MetadataExtractionQuery",
                ParameterValue: "{userid:.userId}",
              },
              {
                ParameterName: "JsonParsingEngine",
                ParameterValue: "JQ-1.6",
              },
            ],
          },
        ],
      }
    );

    const cloudwatchToFirehoseFunction = new lambdanodejs.NodejsFunction(
      this,
      "CloudwatchToFirehoseFunction",
      {
        entry: "./src/cloudwatchToFirehose.ts",
        handler: "handler",
        timeout: cdk.Duration.seconds(60),
        runtime: lambda.Runtime.NODEJS_14_X,
        environment: {
          DELIVERY_STREAM_NAME: s3DeliveryStream.deliveryStreamName,
        },
      }
    );

    s3DeliveryStream.grantPutRecords(cloudwatchToFirehoseFunction);

    const logEventsFunction = new lambdanodejs.NodejsFunction(
      this,
      "LogEventsFunction",
      {
        entry: "./src/logEvents.ts",
        handler: "handler",
        timeout: cdk.Duration.seconds(10),
        runtime: lambda.Runtime.NODEJS_14_X,
      }
    );

    logEventsFunction.logGroup.addSubscriptionFilter(
      "LogEventsFunctionForwardToFirehose",
      {
        destination: new logsdestinations.LambdaDestination(
          cloudwatchToFirehoseFunction
        ),
        filterPattern: {
          logPatternString: `{ $.msg = "AUDIT" }`,
        },
      }
    );

    new CfnOutput(this, "LogEventsFunctionName", {
      value: logEventsFunction.functionName,
    });
  }
}
