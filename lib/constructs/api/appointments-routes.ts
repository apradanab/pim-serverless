import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

interface AppointmentsRoutesProps {
  api: apigateway.RestApi;
  authorizer: apigateway.CognitoUserPoolsAuthorizer;
  handlers: {
    createAppointment: NodejsFunction;
    listAppointments: NodejsFunction;
    getAppointment: NodejsFunction;
    updateAppointment: NodejsFunction;
    deleteAppointment: NodejsFunction;
    requestAppointment: NodejsFunction;
    approveAppointment: NodejsFunction;
    assignAppointment: NodejsFunction;
    requestCancellation: NodejsFunction;
    approveCancellation: NodejsFunction;
    joinGroupAppointment: NodejsFunction;
    leaveGroupAppointment: NodejsFunction;
    listParticipants: NodejsFunction;
  };
}

export class AppointmentsRoutesConstruct extends Construct {
  constructor(scope: Construct, id: string, props: AppointmentsRoutesProps) {
    super(scope, id);

    const appointments = props.api.root.addResource('appointments');
    appointments.addMethod('GET', new apigateway.LambdaIntegration(props.handlers.listAppointments));

    const therapies = props.api.root.getResource('therapies');
    const therapyById = therapies?.getResource('{therapyId}');
    const therapyAppointments = therapyById?.addResource('appointments');
    therapyAppointments?.addMethod('POST', new apigateway.LambdaIntegration(props.handlers.createAppointment), {
      authorizer: props.authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    const appointmentById = therapyAppointments?.addResource('{appointmentId}');
    appointmentById?.addMethod('GET', new apigateway.LambdaIntegration(props.handlers.getAppointment));
    appointmentById?.addMethod('PATCH', new apigateway.LambdaIntegration(props.handlers.updateAppointment), {
      authorizer: props.authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });
    appointmentById?.addMethod('DELETE', new apigateway.LambdaIntegration(props.handlers.deleteAppointment), {
      authorizer: props.authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    appointmentById?.addResource('participants').addMethod('GET', new apigateway.LambdaIntegration(props.handlers.listParticipants), {
      authorizer: props.authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    const appointmentActions = appointmentById?.addResource('actions');
    appointmentActions?.addResource('request').addMethod('POST', new apigateway.LambdaIntegration(props.handlers.requestAppointment), {
      authorizer: props.authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });
    appointmentActions?.addResource('approve').addMethod('POST', new apigateway.LambdaIntegration(props.handlers.approveAppointment), {
      authorizer: props.authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });
    appointmentActions?.addResource('assign').addMethod('POST', new apigateway.LambdaIntegration(props.handlers.assignAppointment), {
      authorizer: props.authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });
    appointmentActions?.addResource('request-cancellation').addMethod('POST', new apigateway.LambdaIntegration(props.handlers.requestCancellation), {
      authorizer: props.authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });
    appointmentActions?.addResource('approve-cancellation').addMethod('POST', new apigateway.LambdaIntegration(props.handlers.approveCancellation), {
      authorizer: props.authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });
    appointmentActions?.addResource('join-group').addMethod('POST', new apigateway.LambdaIntegration(props.handlers.joinGroupAppointment), {
      authorizer: props.authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });
    appointmentActions?.addResource('leave-group').addMethod('POST', new apigateway.LambdaIntegration(props.handlers.leaveGroupAppointment), {
      authorizer: props.authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });
  }
}
