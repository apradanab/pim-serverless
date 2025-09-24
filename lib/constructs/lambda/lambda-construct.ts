import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { DynamoDBConstruct } from '../data/dynamodb-construct';
import { MediaBucket } from '../storage/media-bucket';
import { CognitoConstruct } from '../auth/cognito-construct';
import { TherapiesLambdaConstruct } from './therapies-lambda-construct';
import { AdviceLambdaConstruct } from './advices-lambda-construct';
import { AppointmentsLambdaConstruct } from './appointments-lambda-construct';
import { UsersLambdaConstruct } from './users-lambda-construct';
import { CoreLambdaConstruct } from './core-lambda-construct';

interface LambdaConstructProps {
  dbConstruct: DynamoDBConstruct;
  storageConstruct: MediaBucket;
  authConstruct: CognitoConstruct;
}

export interface AllLambdaHandlers {
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
  listAppointmentsByUser: NodejsFunction;
  requestAppointment: NodejsFunction;
  approveAppointment: NodejsFunction;
  assignAppointment: NodejsFunction;
  requestCancellation: NodejsFunction;
  approveCancellation: NodejsFunction;

  createUser: NodejsFunction;
  approveUser: NodejsFunction;
  completeRegistration: NodejsFunction;
  updateUser: NodejsFunction;
  loginUser: NodejsFunction;
  listUsers: NodejsFunction;
  getUser: NodejsFunction;
  deleteUser: NodejsFunction;

  mediaUpload: NodejsFunction;
}

export class LambdaConstruct extends Construct {
  public readonly handlers: AllLambdaHandlers;

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
    };

    const commonProps = {
      runtime: lambda.Runtime.NODEJS_22_X,
      environment: commonEnv
    };

    const therapies = new TherapiesLambdaConstruct(this, 'TherapiesLambda', {
      dbConstruct: props.dbConstruct,
      storageConstruct: props.storageConstruct,
      commonEnv,
      commonProps
    });

    const advice = new AdviceLambdaConstruct(this, 'AdviceLambda', {
      dbConstruct: props.dbConstruct,
      storageConstruct: props.storageConstruct,
      commonEnv,
      commonProps
    });

    const appointments = new AppointmentsLambdaConstruct(this, 'AppointmentsLambda', {
      dbConstruct: props.dbConstruct,
      commonEnv,
      commonProps
    });

    const users = new UsersLambdaConstruct(this, 'UsersLambda', {
      dbConstruct: props.dbConstruct,
      storageConstruct: props.storageConstruct,
      authConstruct: props.authConstruct,
      commonEnv,
      commonProps
    });

    const core = new CoreLambdaConstruct(this, 'CoreLambda', {
      storageConstruct: props.storageConstruct,
      commonEnv,
      commonProps
    });

    this.handlers = {
      createTherapy: therapies.createTherapy,
      listTherapies: therapies.listTherapies,
      getTherapy: therapies.getTherapy,
      updateTherapy: therapies.updateTherapy,
      deleteTherapy: therapies.deleteTherapy,

      createAdvice: advice.createAdvice,
      listAdvices: advice.listAdvices,
      getAdvice: advice.getAdvice,
      listAdvicesByTherapy: advice.listAdvicesByTherapy,
      updateAdvice: advice.updateAdvice,
      deleteAdvice: advice.deleteAdvice,

      createAppointment: appointments.createAppointment,
      listAppointments: appointments.listAppointments,
      getAppointment: appointments.getAppointment,
      updateAppointment: appointments.updateAppointment,
      deleteAppointment: appointments.deleteAppointment,
      listAppointmentsByUser: appointments.listAppointmentsByUser,
      requestAppointment: appointments.requestAppointment,
      approveAppointment: appointments.approveAppointment,
      assignAppointment: appointments.assignAppointment,
      requestCancellation: appointments.requestCancellation,
      approveCancellation: appointments.approveCancellation,

      createUser: users.createUser,
      approveUser: users.approveUser,
      completeRegistration: users.completeRegistration,
      updateUser: users.updateUser,
      loginUser: users.loginUser,
      listUsers: users.listUsers,
      getUser: users.getUser,
      deleteUser: users.deleteUser,

      mediaUpload: core.mediaUpload
    };
  }
}
