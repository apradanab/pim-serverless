import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

interface AuthRoutesProps {
  api: apigateway.RestApi;
  handlers: {
    loginUser: NodejsFunction;
    createUser: NodejsFunction;
    completeRegistration: NodejsFunction;
  };
}

export class AuthRoutesConstruct extends Construct {
  constructor(scope: Construct, id: string, props: AuthRoutesProps) {
    super(scope, id);

    const auth = props.api.root.addResource('auth');
    auth.addResource('login').addMethod('POST', new apigateway.LambdaIntegration(props.handlers.loginUser));
    auth.addResource('register').addMethod('POST', new apigateway.LambdaIntegration(props.handlers.createUser));
    auth.addResource('complete-registration').addMethod('POST', new apigateway.LambdaIntegration(props.handlers.completeRegistration));
  }
}
