import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

interface TherapiesRoutesProps {
  api: apigateway.RestApi;
  authorizer: apigateway.CognitoUserPoolsAuthorizer;
  handlers: {
    createTherapy: NodejsFunction;
    listTherapies: NodejsFunction;
    getTherapy: NodejsFunction;
    updateTherapy: NodejsFunction;
    deleteTherapy: NodejsFunction;
  };
}

export class TherapiesRoutesConstruct extends Construct {
  constructor(scope: Construct, id: string, props: TherapiesRoutesProps) {
    super(scope, id);

    const therapies = props.api.root.addResource('therapies');

    therapies.addMethod('GET', new apigateway.LambdaIntegration(props.handlers.listTherapies));

    therapies.addMethod('POST', new apigateway.LambdaIntegration(props.handlers.createTherapy), {
      authorizer: props.authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    const therapyById = therapies.addResource('{therapyId}');

    therapyById.addMethod('GET', new apigateway.LambdaIntegration(props.handlers.getTherapy));

    therapyById.addMethod('PATCH', new apigateway.LambdaIntegration(props.handlers.updateTherapy), {
      authorizer: props.authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    therapyById.addMethod('DELETE', new apigateway.LambdaIntegration(props.handlers.deleteTherapy), {
      authorizer: props.authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });
  }
}
