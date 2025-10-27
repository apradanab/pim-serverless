import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { AuthRoutesConstruct } from './auth-routes';
import { MediaRoutesConstruct } from './media-routes';
import { TherapiesRoutesConstruct } from './therapies-routes';
import { AdvicesRoutesConstruct } from './advices-routes';
import { AppointmentsRoutesConstruct } from './appointments-routes';
import { UsersRoutesConstruct } from './users-routes';
import * as cdk from 'aws-cdk-lib';

interface ApiConstructProps {
  lambdaHandlers: {
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
    joinGroupAppointment: NodejsFunction;
    leaveGroupAppointment: NodejsFunction;
    listParticipants: NodejsFunction;

    createUser: NodejsFunction;
    approveUser: NodejsFunction;
    completeRegistration: NodejsFunction;
    updateUser: NodejsFunction;
    loginUser: NodejsFunction;
    listUsers: NodejsFunction;
    getUser: NodejsFunction;
    deleteUser: NodejsFunction;

    mediaUpload: NodejsFunction;
  };
  authConstruct: {
    userPool: cognito.UserPool;
  }
}

export class ApiConstruct extends Construct {
  public readonly api: apigateway.RestApi;
  public readonly authorizer: apigateway.CognitoUserPoolsAuthorizer;
  public readonly mediaApiKey: apigateway.ApiKey;
  public readonly mediaUsagePlan: apigateway.UsagePlan;

  constructor(scope: Construct, id: string, props: ApiConstructProps) {
    super(scope, id);

    this.api = new apigateway.RestApi(this, 'PimApi', {
      restApiName: 'PIM API',
      description: 'Therapy, Advice, Appointments, and Users management API',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    this.authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'PimAuthorizer', {
      cognitoUserPools: [props.authConstruct.userPool],
      identitySource: 'method.request.header.Authorization',
      authorizerName: 'PimCognitoAuthorizer',
    });
    this.authorizer._attachToApi(this.api);

    this.mediaApiKey = new apigateway.ApiKey(this, 'MediaUploadApiKey', {
      apiKeyName: 'MediaUploadKey',
      description: 'Key for media uploads during user registration flow.'
    });

    this.mediaUsagePlan = new apigateway.UsagePlan(this, 'MediaUploadUsagePlan', {
      name: 'MediaUploadPlan',
      throttle: {
        rateLimit: 5,
        burstLimit: 10,
      }
    });

    new apigateway.CfnUsagePlanKey(this, 'MediaUploadUsagePlanKey', {
      keyId: this.mediaApiKey.keyId,
      keyType: 'API_KEY',
      usagePlanId: this.mediaUsagePlan.usagePlanId,
    });

    this.mediaUsagePlan.addApiStage({
      stage: this.api.deploymentStage,
    });

    new cdk.CfnOutput(this, 'MediaUploadKeyId', {
      value: this.mediaApiKey.keyId,
      description: 'ApiKey ID required for media uploads'
    });

    new AuthRoutesConstruct(this, 'AuthRoutes', {
      api: this.api,
      handlers: {
        loginUser: props.lambdaHandlers.loginUser,
        createUser: props.lambdaHandlers.createUser,
        completeRegistration: props.lambdaHandlers.completeRegistration,
      },
    });

    new MediaRoutesConstruct(this, 'MediaRoutes', {
      api: this.api,
      handlers: {
        mediaUpload: props.lambdaHandlers.mediaUpload,
      },
      apiKey: this.mediaApiKey,
    });

    new TherapiesRoutesConstruct(this, 'TherapiesRoutes', {
      api: this.api,
      authorizer: this.authorizer,
      handlers: {
        createTherapy: props.lambdaHandlers.createTherapy,
        listTherapies: props.lambdaHandlers.listTherapies,
        getTherapy: props.lambdaHandlers.getTherapy,
        updateTherapy: props.lambdaHandlers.updateTherapy,
        deleteTherapy: props.lambdaHandlers.deleteTherapy,
      },
    });

    new AdvicesRoutesConstruct(this, 'AdviceRoutes', {
      api: this.api,
      authorizer: this.authorizer,
      handlers: {
        createAdvice: props.lambdaHandlers.createAdvice,
        listAdvices: props.lambdaHandlers.listAdvices,
        getAdvice: props.lambdaHandlers.getAdvice,
        listAdvicesByTherapy: props.lambdaHandlers.listAdvicesByTherapy,
        updateAdvice: props.lambdaHandlers.updateAdvice,
        deleteAdvice: props.lambdaHandlers.deleteAdvice,
      },
    });

    new AppointmentsRoutesConstruct(this, 'AppointmentsRoutes', {
      api: this.api,
      authorizer: this.authorizer,
      handlers: {
        createAppointment: props.lambdaHandlers.createAppointment,
        listAppointments: props.lambdaHandlers.listAppointments,
        getAppointment: props.lambdaHandlers.getAppointment,
        updateAppointment: props.lambdaHandlers.updateAppointment,
        deleteAppointment: props.lambdaHandlers.deleteAppointment,
        requestAppointment: props.lambdaHandlers.requestAppointment,
        approveAppointment: props.lambdaHandlers.approveAppointment,
        assignAppointment: props.lambdaHandlers.assignAppointment,
        requestCancellation: props.lambdaHandlers.requestCancellation,
        approveCancellation: props.lambdaHandlers.approveCancellation,
        joinGroupAppointment: props.lambdaHandlers.joinGroupAppointment,
        leaveGroupAppointment: props.lambdaHandlers.leaveGroupAppointment,
        listParticipants: props.lambdaHandlers.listParticipants,
      },
    });

    new UsersRoutesConstruct(this, 'UsersRoutes', {
      api: this.api,
      authorizer: this.authorizer,
      handlers: {
        listUsers: props.lambdaHandlers.listUsers,
        getUser: props.lambdaHandlers.getUser,
        updateUser: props.lambdaHandlers.updateUser,
        deleteUser: props.lambdaHandlers.deleteUser,
        listAppointmentsByUser: props.lambdaHandlers.listAppointmentsByUser,
        approveUser: props.lambdaHandlers.approveUser,
      },
    });
  }
}
