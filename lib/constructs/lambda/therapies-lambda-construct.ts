import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as path from 'path';
import { DynamoDBConstruct } from '../data/dynamodb-construct';
import { MediaBucket } from '../storage/media-bucket';

interface TherapiesLambdaProps {
  dbConstruct: DynamoDBConstruct;
  storageConstruct: MediaBucket;
  commonEnv: Record<string, string>;
  commonProps: Partial<NodejsFunctionProps>;
}

export class TherapiesLambdaConstruct extends Construct {
  public readonly createTherapy: NodejsFunction;
  public readonly listTherapies: NodejsFunction;
  public readonly getTherapy: NodejsFunction;
  public readonly updateTherapy: NodejsFunction;
  public readonly deleteTherapy: NodejsFunction;

  constructor(scope: Construct, id: string, props: TherapiesLambdaProps) {
    super(scope, id);

    this.createTherapy = this.createHandler('Create', 'therapies/create.ts', props);
    this.listTherapies = this.createHandler('List', 'therapies/list.ts', props);
    this.getTherapy = this.createHandler('Get', 'therapies/get.ts', props);
    this.updateTherapy = this.createHandler('Update', 'therapies/update.ts', props);
    this.deleteTherapy = this.createHandler('Delete', 'therapies/delete.ts', props);

    const table = props.dbConstruct.dataTable;
    table.grantWriteData(this.createTherapy);
    table.grantReadData(this.listTherapies);
    table.grantReadData(this.getTherapy);
    table.grantReadWriteData(this.updateTherapy);
    table.grantWriteData(this.deleteTherapy);

    const bucket = props.storageConstruct.bucket;
    bucket.grantRead(this.createTherapy);
    bucket.grantDelete(this.createTherapy);
    bucket.grantRead(this.updateTherapy);
    bucket.grantDelete(this.updateTherapy);
  }

  private createHandler(id: string, handlerFile: string, props: TherapiesLambdaProps): NodejsFunction {
    return new NodejsFunction(this, id, {
      runtime: lambda.Runtime.NODEJS_22_X,
      environment: props.commonEnv,
      entry: path.join(__dirname, '..', '..', '..','functions', handlerFile),
      handler: 'handler',
      ...props.commonProps,
    });
  }
}
