import * as kinesisfirehose from "@aws-cdk/aws-kinesisfirehose";
import * as destinations from "@aws-cdk/aws-kinesisfirehose-destinations";
import * as lambda from "@aws-cdk/aws-lambda";
import * as lambdanodejs from "@aws-cdk/aws-lambda-nodejs";
import * as logs from "@aws-cdk/aws-logs";
import * as s3 from "@aws-cdk/aws-s3";
import * as cdk from "@aws-cdk/core";

export class KinesisDataFirehoseS3Stack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

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
      bufferingInterval: cdk.Duration.minutes(10),
      bufferingSize: cdk.Size.mebibytes(8),
      compression: undefined, // NONE
    });

    const s3DeliveryStream = new kinesisfirehose.DeliveryStream(
      this,
      "S3DeliveryStream",
      {
        destinations: [s3Destination],
      }
    );

    const putEventsFunction = new lambdanodejs.NodejsFunction(
      this,
      "PutEventsFunction",
      {
        entry: "./src/putEvents.ts",
        handler: "handler",
        timeout: cdk.Duration.seconds(10),
        runtime: lambda.Runtime.NODEJS_14_X,
        environment: {
          DELIVERY_STREAM_NAME: s3DeliveryStream.deliveryStreamName,
        },
      }
    );

    s3DeliveryStream.grantPutRecords(putEventsFunction);
  }
}
