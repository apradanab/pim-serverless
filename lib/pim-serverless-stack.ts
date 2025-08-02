import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { DynamoDBConstruct } from './constructs/dynamodb-construct';
import { LambdaConstruct } from './constructs/lambda-construct';
import { ApiConstruct } from './constructs/api-construct';

export class PimServerlessStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const dbConstruct = new DynamoDBConstruct(this, 'DynamoDB');
    const lambdaConstruct = new LambdaConstruct(this, 'Lambda', { dbConstruct });
    const _apiConstruct = new ApiConstruct(this, 'PimApi', {
      lambdaHandlers: lambdaConstruct.handlers
     });
   }
}
