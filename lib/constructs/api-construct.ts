import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

interface ApiConstructProps {
  lambdaHandlers: {
    createTherapy: NodejsFunction;
    getAllTherapies: NodejsFunction;
    getTherapyById: NodejsFunction;
    updateTherapy: NodejsFunction;
    deleteTherapy: NodejsFunction;
    createAdvice: NodejsFunction;
  };
}

export class ApiConstruct extends Construct {
  public readonly api: apigateway.RestApi;

  constructor(scope: Construct, id: string, props: ApiConstructProps) {
    super(scope, id);

    this.api = new apigateway.RestApi(this, 'PimApi', {
      restApiName: 'PIM Service',
      description: 'Therapy and Advice management API',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    const therapies = this.api.root.addResource('therapies');
    therapies.addMethod('GET', new apigateway.LambdaIntegration(props.lambdaHandlers.getAllTherapies));
    therapies.addMethod('POST', new apigateway.LambdaIntegration(props.lambdaHandlers.createTherapy));

    const therapyById = therapies.addResource('{therapyId}');
    therapyById.addMethod('GET', new apigateway.LambdaIntegration(props.lambdaHandlers.getTherapyById));
    therapyById.addMethod('PATCH', new apigateway.LambdaIntegration(props.lambdaHandlers.updateTherapy));
    therapyById.addMethod('DELETE', new apigateway.LambdaIntegration(props.lambdaHandlers.deleteTherapy));

    const advices = therapyById.addResource('advices');
    advices.addMethod('POST', new apigateway.LambdaIntegration(props.lambdaHandlers.createAdvice));
  }
}
