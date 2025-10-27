import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { DynamoDBConstruct } from './constructs/data/dynamodb-construct';
import { LambdaConstruct } from './constructs/lambda/lambda-construct';
import { ApiConstruct } from './constructs/api/rest-api';
import { MediaBucket } from './constructs/storage/media-bucket';
import { CognitoConstruct } from './constructs/auth/cognito-construct';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';

export class PimServerlessStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const dbConstruct = new DynamoDBConstruct(this, 'DynamoDB');
    const storageConstruct = new MediaBucket(this, 'MediaStorage');
    const authConstruct = new CognitoConstruct(this, 'PimCognito');

    const lambdaConstruct = new LambdaConstruct(this, 'Lambda', {
      dbConstruct,
      storageConstruct,
      authConstruct
    });

    const _apiConstruct = new ApiConstruct(this, 'PimApi', {
      lambdaHandlers: lambdaConstruct.handlers,
      authConstruct: {
        userPool: authConstruct.userPool
      }
     });

     const _completePastRule = new events.Rule(this, 'CompletePastAppointmentsRule', {
      ruleName: 'complete-past-appointments-hourly',
      schedule: events.Schedule.rate(cdk.Duration.hours(1)),
      targets: [new targets.LambdaFunction(lambdaConstruct.handlers.completePastAppointments)]
     });

     const _deleteExpiredRule = new events.Rule(this, 'DeleteExpiredAptsRule', {
      ruleName: 'delete-expired-available-apts-hourly',
      schedule: events.Schedule.rate(cdk.Duration.hours(1)),
      targets: [new targets.LambdaFunction(lambdaConstruct.handlers.deleteExpiredAppointments)]
     });

     new cdk.CfnOutput(this, 'MediaCdnUrl', {
      value: storageConstruct.distribution.distributionDomainName
     })

     new cdk.CfnOutput(this, 'PimUserPoolId', {
      value: authConstruct.userPool.userPoolId
     })
   }
}
