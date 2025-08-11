import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as path from 'path';
import { Construct } from 'constructs';
import { DynamoDBConstruct } from './data/dynamodb-construct';
import { MediaBucket } from './storage/media-bucket';

interface LambdaConstructProps {
  dbConstruct: DynamoDBConstruct;
  storageConstruct: MediaBucket;
}

type LambdaHandlers = {
  createTherapy: NodejsFunction;
  listTherapies: NodejsFunction;
  getTherapy: NodejsFunction;
  updateTherapy: NodejsFunction;
  deleteTherapy: NodejsFunction;

  createAdvice: NodejsFunction;
  listAdvices: NodejsFunction;
  getAdvice: NodejsFunction;
  listAdvicesByTherapy: NodejsFunction;
  updateAdvice: NodejsFunction;
  deleteAdvice: NodejsFunction;

  createAppointment: NodejsFunction;
  
  mediaUpload: NodejsFunction;
};

export class LambdaConstruct extends Construct {
  public readonly handlers: LambdaHandlers;

  constructor(scope: Construct, id: string, props: LambdaConstructProps) {
    super(scope, id);

    const commonEnv = {
      TABLE_NAME: props.dbConstruct.dataTable.tableName,
      BUCKET_NAME: props.storageConstruct.bucket.bucketName,
      CDN_DOMAIN: props.storageConstruct.distribution.distributionDomainName
    }

    const commonProps = {
      runtime: lambda.Runtime.NODEJS_22_X,
      environment: commonEnv
    }

    this.handlers = {
      createTherapy: this.createHandler('CreateTherapy', 'therapies/create.ts', commonProps),
      listTherapies: this.createHandler('ListTherapies', 'therapies/list.ts', commonProps),
      getTherapy: this.createHandler('GetTherapy', 'therapies/get.ts', commonProps),
      updateTherapy: this.createHandler('UpdateTherapy', 'therapies/update.ts', commonProps),
      deleteTherapy: this.createHandler('DeleteTherapy', 'therapies/delete.ts', commonProps),
      createAdvice: this.createHandler('CreateAdvice', 'advices/create.ts', commonProps),
      listAdvices: this.createHandler('ListAdvices', 'advices/list.ts', commonProps),
      getAdvice: this.createHandler('GetAdvice', 'advices/get.ts', commonProps),
      listAdvicesByTherapy: this.createHandler('ListAdvicesByTherapy', 'advices/list-by-therapy.ts', commonProps),
      updateAdvice: this.createHandler('UpdateAdvice', 'advices/update.ts', commonProps),
      deleteAdvice: this.createHandler('DeleteAdvice', 'advices/delete.ts', commonProps),
      createAppointment: this.createHandler('CreateAppointment', 'appointments/create.ts', commonProps),
      mediaUpload: this.createHandler('MediaUpload', 'core/media-upload.ts', commonProps)
    };

    const table = props.dbConstruct.dataTable;
    table.grantWriteData(this.handlers.createTherapy);
    table.grantReadData(this.handlers.listTherapies);
    table.grantReadData(this.handlers.getTherapy);
    table.grantReadWriteData(this.handlers.updateTherapy);
    table.grantWriteData(this.handlers.deleteTherapy);
    table.grantWriteData(this.handlers.createAdvice);
    table.grantReadData(this.handlers.listAdvices);
    table.grantReadData(this.handlers.getAdvice);
    table.grantReadData(this.handlers.listAdvicesByTherapy);
    table.grantReadWriteData(this.handlers.updateAdvice);
    table.grantWriteData(this.handlers.deleteAdvice);
    table.grantWriteData(this.handlers.createAppointment);

    props.storageConstruct.bucket.grantPut(this.handlers.mediaUpload);
  }

  private createHandler(
    id: string,
    handlerFile: string,
    props: Partial<NodejsFunctionProps>
  ): NodejsFunction {
    return new NodejsFunction(this, id, {
      ...props,
      entry: path.join(__dirname, '..', '..', 'functions', handlerFile),
      handler: 'handler',
    });
  }
}
