import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as path from 'path';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as lambda from 'aws-cdk-lib/aws-lambda';

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

    const createTherapy = new NodejsFunction(this, 'CreateTherapy', {
      entry: path.join(__dirname, '..', 'lambda', 'handlers', 'create-therapy.ts'),
      handler: 'handler',
      environment: {
        TABLE_NAME : this.dataTable.tableName,
      },
    });

    const getAllTherapies = new NodejsFunction(this, 'GetAllTherapies', {
      runtime: lambda.Runtime.NODEJS_LATEST,
      entry: path.join(__dirname, '..', 'lambda', 'handlers', 'get-all-therapies.ts'),
      handler: 'handler',
      environment: {
        TABLE_NAME: this.dataTable.tableName,
      }
    })

    const getTherapyById = new NodejsFunction(this, 'GetTherapyById', {
      runtime: lambda.Runtime.NODEJS_LATEST,
      entry: path.join(__dirname, '..', 'lambda', 'handlers', 'get-therapy-by-id.ts'),
      handler: 'handler',
      environment: {
        TABLE_NAME: this.dataTable.tableName,
      }
    })

    const updateTherapy = new NodejsFunction(this, 'UpdateTherapy', {
      entry: path.join(__dirname, '..', 'lambda', 'handlers', 'update-therapy.ts'),
      handler: 'handler',
      environment: {
        TABLE_NAME: this.dataTable.tableName
      }
    })

    const deleteTherapy = new NodejsFunction(this, 'DeleteTherapy', {
      entry: path.join(__dirname, '..', 'lambda', 'handlers', 'delete-therapy.ts'),
      handler: 'handler',
      environment: {
        TABLE_NAME: this.dataTable.tableName
      }
    })

    const createAdvice = new NodejsFunction(this, 'CreateAdvice', {
      runtime: lambda.Runtime.NODEJS_LATEST,
      entry: path.join(__dirname, '..', 'lambda', 'handlers', 'create-advice.ts'),
      handler: 'handler',
      environment: {
        TABLE_NAME : this.dataTable.tableName,
      },
    });

    this.dataTable.grantWriteData(createTherapy);
    this.dataTable.grantReadData(getAllTherapies);
    this.dataTable.grantReadData(getTherapyById);
    this.dataTable.grantWriteData(updateTherapy);
    this.dataTable.grantWriteData(deleteTherapy);

    this.dataTable.grantWriteData(createAdvice);

    const api = new apigateway.RestApi(this, 'PimApi', {
      restApiName: 'PIM Service',
      description: 'Therapy and Advice management API',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    const therapies = api.root.addResource('therapies');
    therapies.addMethod('POST', new apigateway.LambdaIntegration(createTherapy));
    therapies.addMethod('GET', new apigateway.LambdaIntegration(getAllTherapies));

    const therapyById = therapies.addResource('{therapyId}');
    therapyById.addMethod('GET', new apigateway.LambdaIntegration(getTherapyById));
    therapyById.addMethod('PATCH', new apigateway.LambdaIntegration(updateTherapy));
    therapyById.addMethod('DELETE', new apigateway.LambdaIntegration(deleteTherapy));

    const advices = therapyById.addResource('advices');
    advices.addMethod('POST', new apigateway.LambdaIntegration(createAdvice));
  }
}
