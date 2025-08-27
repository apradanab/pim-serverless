import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

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

    mediaUpload: NodejsFunction;
  };
  authConstruct: {
    userPool: cognito.UserPool;
  }
}

export class ApiConstruct extends Construct {
  public readonly api: apigateway.RestApi;

  constructor(scope: Construct, id: string, props: ApiConstructProps) {
    super(scope, id);

    this.api = new apigateway.RestApi(this, 'PimApi', {
      restApiName: 'PIM Service',
      description: 'Therapy, Advice, and Appointments management API',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    const therapies = this.api.root.addResource('therapies');
    therapies.addMethod('GET', new apigateway.LambdaIntegration(props.lambdaHandlers.listTherapies));
    therapies.addMethod('POST', new apigateway.LambdaIntegration(props.lambdaHandlers.createTherapy));

    const therapyById = therapies.addResource('{therapyId}');
    therapyById.addMethod('GET', new apigateway.LambdaIntegration(props.lambdaHandlers.getTherapy));
    therapyById.addMethod('PATCH', new apigateway.LambdaIntegration(props.lambdaHandlers.updateTherapy));
    therapyById.addMethod('DELETE', new apigateway.LambdaIntegration(props.lambdaHandlers.deleteTherapy));

    const therapyAdvices = therapyById.addResource('advices');
    therapyAdvices.addMethod('POST', new apigateway.LambdaIntegration(props.lambdaHandlers.createAdvice));
    therapyAdvices.addMethod('GET', new apigateway.LambdaIntegration(props.lambdaHandlers.listAdvicesByTherapy));

    const adviceById = therapyAdvices.addResource('{adviceId}');
    adviceById.addMethod('GET', new apigateway.LambdaIntegration(props.lambdaHandlers.getAdvice));
    adviceById.addMethod('PATCH', new apigateway.LambdaIntegration(props.lambdaHandlers.updateAdvice));
    adviceById.addMethod('DELETE', new apigateway.LambdaIntegration(props.lambdaHandlers.deleteAdvice));

    const advices = this.api.root.addResource('advices');
    advices.addMethod('GET', new apigateway.LambdaIntegration(props.lambdaHandlers.listAdvices));

    const therapyAppointments = therapyById.addResource('appointments');
    therapyAppointments.addMethod('POST', new apigateway.LambdaIntegration(props.lambdaHandlers.createAppointment));

    const appointmentById = therapyAppointments.addResource('{appointmentId}');
    appointmentById.addMethod('GET', new apigateway.LambdaIntegration(props.lambdaHandlers.getAppointment));
    appointmentById.addMethod('PATCH', new apigateway.LambdaIntegration(props.lambdaHandlers.updateAppointment));
    appointmentById.addMethod('DELETE', new apigateway.LambdaIntegration(props.lambdaHandlers.deleteAppointment));

    const appointments = this.api.root.addResource('appointments');
    appointments.addMethod('GET', new apigateway.LambdaIntegration(props.lambdaHandlers.listAppointments));

    const media = this.api.root.addResource('media');
    const mediaType = media.addResource('{type}');
    const mediaTypeAndId = mediaType.addResource('{id}');
    mediaTypeAndId.addMethod('PUT', new apigateway.LambdaIntegration(props.lambdaHandlers.mediaUpload))

  }
}
