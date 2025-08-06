import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { DynamoDBConstruct } from './constructs/data/dynamodb-construct';
import { LambdaConstruct } from './constructs/lambda-construct';
import { ApiConstruct } from './constructs/api/rest-api';
import { MediaBucket } from './constructs/storage/media-bucket';

export class PimServerlessStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const dbConstruct = new DynamoDBConstruct(this, 'DynamoDB');
    const storageConstruct = new MediaBucket(this, 'MediaStorage');

    const lambdaConstruct = new LambdaConstruct(this, 'Lambda', {
      dbConstruct,
      storageConstruct
     });

    const _apiConstruct = new ApiConstruct(this, 'PimApi', {
      lambdaHandlers: lambdaConstruct.handlers
     });

     new cdk.CfnOutput(this, 'MediaCdnUrl', {
      value: storageConstruct.distribution.distributionDomainName
     })
   }
}
