import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

interface UsersRoutesProps {
  api: apigateway.RestApi;
  authorizer: apigateway.CognitoUserPoolsAuthorizer;
  handlers: {
    listUsers: NodejsFunction;
    getUser: NodejsFunction;
    listAppointmentsByUser: NodejsFunction;
    approveUser: NodejsFunction;
    updateUser: NodejsFunction;
    deleteUser: NodejsFunction;
  };
}

export class UsersRoutesConstruct extends Construct {
  constructor(scope: Construct, id: string, props: UsersRoutesProps) {
    super(scope, id);

    const users = props.api.root.addResource('users');
    users.addMethod('GET', new apigateway.LambdaIntegration(props.handlers.listUsers), {
      authorizer: props.authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    const userById = users.addResource('{userId}');
    userById.addMethod('GET', new apigateway.LambdaIntegration(props.handlers.getUser));
    userById.addMethod('PATCH', new apigateway.LambdaIntegration(props.handlers.updateUser), {
      authorizer: props.authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });
    userById.addMethod('DELETE', new apigateway.LambdaIntegration(props.handlers.deleteUser), {
      authorizer: props.authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    const userAppointments = userById.addResource('appointments');
    userAppointments.addMethod('GET', new apigateway.LambdaIntegration(props.handlers.listAppointmentsByUser), {
      authorizer: props.authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    const admin = props.api.root.addResource('admin');
    const usersAdmin = admin.addResource('users');
    const userAdminById = usersAdmin.addResource('{userId}');
    userAdminById.addResource('approve').addMethod('POST', new apigateway.LambdaIntegration(props.handlers.approveUser), {
      authorizer: props.authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    })
  }
}
