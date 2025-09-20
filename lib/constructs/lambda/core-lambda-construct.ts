import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as path from 'path';
import { MediaBucket } from '../storage/media-bucket';

interface CoreLambdaProps {
  storageConstruct: MediaBucket;
  commonEnv: Record<string, string>;
  commonProps: Partial<NodejsFunctionProps>;
}

export class CoreLambdaConstruct extends Construct {
  public readonly mediaUpload: NodejsFunction;

  constructor(scope: Construct, id: string, props: CoreLambdaProps) {
    super(scope, id);

    this.mediaUpload = this.createHandler('MediaUpload', 'core/media-upload.ts', props);

    const bucket = props.storageConstruct.bucket;
    bucket.grantPut(this.mediaUpload);
  }

  private createHandler(id: string, handlerFile: string, props: CoreLambdaProps): NodejsFunction {
    return new NodejsFunction(this, id, {
      runtime: lambda.Runtime.NODEJS_22_X,
      environment: props.commonEnv,
      entry: path.join(__dirname, '..', '..', '..', 'functions', handlerFile),
      handler: 'handler',
      ...props.commonProps,
    });
  }
}
