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
    getAllAdvices: NodejsFunction;
    getAdviceById: NodejsFunction;
    getAdvicesByTherapyId: NodejsFunction;
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

    const therapyAdvices = therapyById.addResource('advices');
    therapyAdvices.addMethod('POST', new apigateway.LambdaIntegration(props.lambdaHandlers.createAdvice));
    therapyAdvices.addMethod('GET', new apigateway.LambdaIntegration(props.lambdaHandlers.getAdvicesByTherapyId));

    const adviceById = therapyAdvices.addResource('{adviceId}');
    adviceById.addMethod('GET', new apigateway.LambdaIntegration(props.lambdaHandlers.getAdviceById));

    const advices = this.api.root.addResource('advices');
    advices.addMethod('GET', new apigateway.LambdaIntegration(props.lambdaHandlers.getAllAdvices));   
  }
}
