import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as path from 'path';
import { DynamoDBConstruct } from '../data/dynamodb-construct';
import { MediaBucket } from '../storage/media-bucket';

interface AdviceLambdaProps {
  dbConstruct: DynamoDBConstruct;
  storageConstruct: MediaBucket;
  commonEnv: Record<string, string>;
  commonProps: Partial<NodejsFunctionProps>;
}

export class AdviceLambdaConstruct extends Construct {
  public readonly createAdvice: NodejsFunction;
  public readonly listAdvices: NodejsFunction;
  public readonly getAdvice: NodejsFunction;
  public readonly listAdvicesByTherapy: NodejsFunction;
  public readonly updateAdvice: NodejsFunction;
  public readonly deleteAdvice: NodejsFunction;

  constructor(scope: Construct, id: string, props: AdviceLambdaProps) {
    super(scope, id);

    this.createAdvice = this.createHandler('Create', 'advices/create.ts', props);
    this.listAdvices = this.createHandler('List', 'advices/list.ts', props);
    this.getAdvice = this.createHandler('Get', 'advices/get.ts', props);
    this.listAdvicesByTherapy = this.createHandler('ListByTherapy', 'advices/list-by-therapy.ts', props);
    this.updateAdvice = this.createHandler('Update', 'advices/update.ts', props);
    this.deleteAdvice = this.createHandler('Delete', 'advices/delete.ts', props);

    const table = props.dbConstruct.dataTable;
    table.grantWriteData(this.createAdvice);
    table.grantReadData(this.listAdvices);
    table.grantReadData(this.getAdvice);
    table.grantReadData(this.listAdvicesByTherapy);
    table.grantReadWriteData(this.updateAdvice);
    table.grantWriteData(this.deleteAdvice);

    const bucket = props.storageConstruct.bucket;
    bucket.grantRead(this.createAdvice);
    bucket.grantDelete(this.createAdvice);
    bucket.grantRead(this.updateAdvice);
    bucket.grantDelete(this.updateAdvice);
  }

  private createHandler(id: string, handlerFile: string, props: AdviceLambdaProps): NodejsFunction {
    return new NodejsFunction(this, id, {
      runtime: lambda.Runtime.NODEJS_22_X,
      environment: props.commonEnv,
      entry: path.join(__dirname, '..', '..', '..', 'functions', handlerFile),
      handler: 'handler',
      ...props.commonProps,
    });
  }
}
