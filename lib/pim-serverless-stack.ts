import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as path from 'path';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class PimServerlessStack extends cdk.Stack {
  public readonly dataTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.dataTable = new dynamodb.Table(this, 'PimTable', {
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const createTherapy = new lambda.Function(this, 'CreateTherapy', {
      runtime: lambda.Runtime.NODEJS_LATEST,
      handler: 'create-therapy.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/handlers')),
      environment: {
        TABLE_NAME : this.dataTable.tableName,
      },
    });

    this.dataTable.grantWriteData(createTherapy);

    const api = new apigateway.RestApi(this, 'PimApi', {
      restApiName: 'PIM Service',
      description: 'Therapy management API',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    const therapies = api.root.addResource('therapies');
    therapies.addMethod('POST', new apigateway.LambdaIntegration(createTherapy));
  }
}
