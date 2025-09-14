import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { DynamoDBConstruct } from './data/dynamodb-construct';
import { MediaBucket } from './storage/media-bucket';
import { CognitoConstruct } from './auth/cognito-construct';
import * as iam from 'aws-cdk-lib/aws-iam';

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
  approveUser: NodejsFunction;
  updateUser: NodejsFunction;
  loginUser: NodejsFunction;
  listUsers: NodejsFunction;
  getUser: NodejsFunction;
  deleteUser: NodejsFunction;

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
      SOURCE_EMAIL: 'apradanab@gmail.com'
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
      approveUser: this.createHandler('ApproveUser', 'users/approve.ts', commonProps),
      updateUser: this.createHandler('UpdateUser', 'users/update.ts', commonProps),
      loginUser: this.createHandler('LoginUser', 'users/login.ts', commonProps),
      listUsers: this.createHandler('ListUsers', 'users/list.ts', commonProps),
      getUser: this.createHandler('GetUser', 'users/get.ts', commonProps),
      deleteUser: this.createHandler('ListUsers', 'users/list.ts', commonProps),

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

    table.grantReadWriteData(this.handlers.createUser);
    table.grantReadWriteData(this.handlers.approveUser);
    table.grantReadWriteData(this.handlers.updateUser);
    table.grantReadData(this.handlers.loginUser);
    table.grantReadData(this.handlers.getUser);
    table.grantReadData(this.handlers.listUsers);
    table.grantWriteData(this.handlers.deleteUser);

    const bucket = props.storageConstruct.bucket;

    bucket.grantPut(this.handlers.mediaUpload);
    bucket.grantRead(this.handlers.createTherapy);
    bucket.grantDelete(this.handlers.createTherapy);
    bucket.grantRead(this.handlers.updateTherapy);
    bucket.grantDelete(this.handlers.updateTherapy);

    bucket.grantRead(this.handlers.createAdvice);
    bucket.grantDelete(this.handlers.createAdvice);
    bucket.grantRead(this.handlers.updateAdvice);
    bucket.grantDelete(this.handlers.updateAdvice);

    bucket.grantRead(this.handlers.updateUser);
    bucket.grantWrite(this.handlers.updateUser);

    props.authConstruct.userPool.grant(
      this.handlers.loginUser,
      'cognito-idp:AdminInitiateAuth'
    );

    props.authConstruct.userPool.grant(
      this.handlers.approveUser,
      'cognito-idp:AdminCreateUser',
      'cognito-idp:AdminSetUserPassword'
    );

    props.authConstruct.userPool.grant(
      this.handlers.updateUser,
      'cognito-idp:AdminSetUserPassword'
    );

    this.handlers.approveUser.addToRolePolicy(new iam.PolicyStatement({
      actions: ['ses:SendEmail', 'ses:SendRawEmail'],
      resources: ['*']
    }))
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
