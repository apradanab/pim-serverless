import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { DynamoDBConstruct } from './data/dynamodb-construct';
import { MediaBucket } from './storage/media-bucket';
import { CognitoConstruct } from './auth/cognito-construct';

interface LambdaConstructProps {
  dbConstruct: DynamoDBConstruct;
  storageConstruct: MediaBucket;
  authConstruct: CognitoConstruct;
}

type LambdaHandlers = {
  createTherapy: NodejsFunction;
  listTherapies: NodejsFunction;
  getTherapy: NodejsFunction;
  updateTherapy: NodejsFunction;
  deleteTherapy: NodejsFunction;

  createAdvice: NodejsFunction;
  listAdvices: NodejsFunction;
  getAdvice: NodejsFunction;
  listAdvicesByTherapy: NodejsFunction;
  updateAdvice: NodejsFunction;
  deleteAdvice: NodejsFunction;

  createAppointment: NodejsFunction;
  listAppointments: NodejsFunction;
  getAppointment: NodejsFunction;
  updateAppointment: NodejsFunction;
  deleteAppointment: NodejsFunction;

  createUser: NodejsFunction;
  // loginUser: NodejsFunction;

  mediaUpload: NodejsFunction;
};

export class LambdaConstruct extends Construct {
  public readonly handlers: LambdaHandlers;

  constructor(scope: Construct, id: string, props: LambdaConstructProps) {
    super(scope, id);

    const commonEnv = {
      TABLE_NAME: props.dbConstruct.dataTable.tableName,
      BUCKET_NAME: props.storageConstruct.bucket.bucketName,
      CDN_DOMAIN: props.storageConstruct.distribution.distributionDomainName,
      USER_POOL_ID: props.authConstruct.userPool.userPoolId,
      USER_POOL_CLIENT_ID: props.authConstruct.userPoolClient.userPoolClientId,
      REGION: cdk.Stack.of(this).region,
    }

    const commonProps = {
      runtime: lambda.Runtime.NODEJS_22_X,
      environment: commonEnv
    }

    this.handlers = {
      createTherapy: this.createHandler('CreateTherapy', 'therapies/create.ts', commonProps),
      listTherapies: this.createHandler('ListTherapies', 'therapies/list.ts', commonProps),
      getTherapy: this.createHandler('GetTherapy', 'therapies/get.ts', commonProps),
      updateTherapy: this.createHandler('UpdateTherapy', 'therapies/update.ts', commonProps),
      deleteTherapy: this.createHandler('DeleteTherapy', 'therapies/delete.ts', commonProps),

      createAdvice: this.createHandler('CreateAdvice', 'advices/create.ts', commonProps),
      listAdvices: this.createHandler('ListAdvices', 'advices/list.ts', commonProps),
      getAdvice: this.createHandler('GetAdvice', 'advices/get.ts', commonProps),
      listAdvicesByTherapy: this.createHandler('ListAdvicesByTherapy', 'advices/list-by-therapy.ts', commonProps),
      updateAdvice: this.createHandler('UpdateAdvice', 'advices/update.ts', commonProps),
      deleteAdvice: this.createHandler('DeleteAdvice', 'advices/delete.ts', commonProps),

      createAppointment: this.createHandler('CreateAppointment', 'appointments/create.ts', commonProps),
      listAppointments: this.createHandler('ListAppointments', 'appointments/list.ts', commonProps),
      getAppointment: this.createHandler('GetAppointment', 'appointments/get.ts', commonProps),
      updateAppointment: this.createHandler('UpdateAppointment', 'appointments/update.ts', commonProps),
      deleteAppointment: this.createHandler('DeleteAppointment', 'appointments/delete.ts', commonProps),

      createUser: this.createHandler('CreateUser', 'users/create.ts', commonProps),
      // loginUser: this.createHandler('LoginUser', 'users/login.ts', commonProps),

      mediaUpload: this.createHandler('MediaUpload', 'core/media-upload.ts', commonProps)
    };

    const table = props.dbConstruct.dataTable;
    table.grantWriteData(this.handlers.createTherapy);
    table.grantReadData(this.handlers.listTherapies);
    table.grantReadData(this.handlers.getTherapy);
    table.grantReadWriteData(this.handlers.updateTherapy);
    table.grantWriteData(this.handlers.deleteTherapy);

    table.grantWriteData(this.handlers.createAdvice);
    table.grantReadData(this.handlers.listAdvices);
    table.grantReadData(this.handlers.getAdvice);
    table.grantReadData(this.handlers.listAdvicesByTherapy);
    table.grantReadWriteData(this.handlers.updateAdvice);
    table.grantWriteData(this.handlers.deleteAdvice);

    table.grantWriteData(this.handlers.createAppointment);
    table.grantReadData(this.handlers.listAppointments);
    table.grantReadData(this.handlers.getAppointment);
    table.grantReadWriteData(this.handlers.updateAppointment);
    table.grantWriteData(this.handlers.deleteAppointment);

    table.grantWriteData(this.handlers.createUser);
    table.grantReadData(this.handlers.createUser);
    // table.grantReadData(this.handlers.loginUser);
    // props.authConstruct.userPool.grant(
    //   this.handlers.loginUser,
    //   'cognito-idp:AdminInitiateAuth'
    // );

    props.storageConstruct.bucket.grantPut(this.handlers.mediaUpload);
    props.storageConstruct.bucket.grantRead(this.handlers.createTherapy);
    props.storageConstruct.bucket.grantDelete(this.handlers.createTherapy);
    props.storageConstruct.bucket.grantRead(this.handlers.updateTherapy);
    props.storageConstruct.bucket.grantDelete(this.handlers.updateTherapy);

    props.storageConstruct.bucket.grantRead(this.handlers.createAdvice);
    props.storageConstruct.bucket.grantDelete(this.handlers.createAdvice);
    props.storageConstruct.bucket.grantRead(this.handlers.updateAdvice);
    props.storageConstruct.bucket.grantDelete(this.handlers.updateAdvice);
  }

  private createHandler(
    id: string,
    handlerFile: string,
    props: Partial<NodejsFunctionProps>
  ): NodejsFunction {
    return new NodejsFunction(this, id, {
      ...props,
      entry: path.join(__dirname, '..', '..', 'functions', handlerFile),
      handler: 'handler',
    });
  }
}
