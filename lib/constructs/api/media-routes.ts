import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

interface MediaRoutesProps {
  api: apigateway.RestApi;
  apiKey: apigateway.ApiKey;
  handlers: {
    mediaUpload: NodejsFunction;
  };
}

export class MediaRoutesConstruct extends Construct {
  constructor(scope: Construct, id: string, props: MediaRoutesProps) {
    super(scope, id);

    const media = props.api.root.addResource('media');
    const mediaType = media.addResource('{type}');
    const mediaTypeAndId = mediaType.addResource('{id}');
    mediaTypeAndId.addMethod('PUT', new apigateway.LambdaIntegration(props.handlers.mediaUpload), {
      apiKeyRequired: true,
    });
  }
}
