import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

interface AdvicesRoutesProps {
  api: apigateway.RestApi;
  authorizer: apigateway.CognitoUserPoolsAuthorizer;
  handlers: {
    createAdvice: NodejsFunction;
    listAdvices: NodejsFunction;
    getAdvice: NodejsFunction;
    listAdvicesByTherapy: NodejsFunction;
    updateAdvice: NodejsFunction;
    deleteAdvice: NodejsFunction;
  };
}

export class AdvicesRoutesConstruct extends Construct {
  constructor(scope: Construct, id: string, props: AdvicesRoutesProps) {
    super(scope, id);

    const advices = props.api.root.addResource('advices');
    advices.addMethod('GET', new apigateway.LambdaIntegration(props.handlers.listAdvices));

    const therapies = props.api.root.getResource('therapies');
    const therapyById = therapies?.getResource('{therapyId}');
    const therapyAdvices = therapyById?.addResource('advices');
    therapyAdvices?.addMethod('GET', new apigateway.LambdaIntegration(props.handlers.listAdvicesByTherapy));
    therapyAdvices?.addMethod('POST', new apigateway.LambdaIntegration(props.handlers.createAdvice), {
      authorizer: props.authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    })

    const adviceById = therapyAdvices?.addResource('{adviceId}');
    adviceById?.addMethod('GET', new apigateway.LambdaIntegration(props.handlers.getAdvice));
    adviceById?.addMethod('PATCH', new apigateway.LambdaIntegration(props.handlers.updateAdvice), {
      authorizer: props.authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });
    adviceById?.addMethod('DELETE', new apigateway.LambdaIntegration(props.handlers.deleteAdvice), {
      authorizer: props.authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });
  }
}
