# kinesis-data-firehose-s3

CDK stack showing you how to setup dynamic partitioning with kinesis data firehose and s3.

[logEvent lambda] -> logs to -> [cloudwatch] -> cloudwatch logs filter -> [cloudwatchToFirehose lambda] -> [kinesis firehose]

Add a .env file

```
CDK_DEFAULT_ACCOUNT=xxx
CDK_DEFAULT_REGION=xxx
AWS_PROFILE=xxx
```
