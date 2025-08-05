import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as path from 'path';
import { Construct } from 'constructs';
import { DynamoDBConstruct } from './dynamodb-construct';
import { MediaBucket } from './storage/media-bucket';

interface LambdaConstructProps {
  dbConstruct: DynamoDBConstruct;
  storageConstruct: MediaBucket;
}

type LambdaHandlers = {
  createTherapy: NodejsFunction;
  getAllTherapies: NodejsFunction;
  getTherapyById: NodejsFunction;
  updateTherapy: NodejsFunction;
  deleteTherapy: NodejsFunction;
  createAdvice: NodejsFunction;
  getAllAdvices: NodejsFunction;
  getAdviceById: NodejsFunction;
  getAdvicesByTherapyId: NodejsFunction;
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
      createTherapy: this.createHandler('CreateTherapy', 'therapies/create-therapy.ts', commonProps),
      getAllTherapies: this.createHandler('GetAllTherapies', 'therapies/get-all-therapies.ts', commonProps),
      getTherapyById: this.createHandler('GetTherapyById', 'therapies/get-therapy-by-id.ts', commonProps),
      updateTherapy: this.createHandler('UpdateTherapy', 'therapies/update-therapy.ts', commonProps),
      deleteTherapy: this.createHandler('DeleteTherapy', 'therapies/delete-therapy.ts', commonProps),
      createAdvice: this.createHandler('CreateAdvice', 'advices/create-advice.ts', commonProps),
      getAllAdvices: this.createHandler('GetAllAdvices', 'advices/get-all-advices.ts', commonProps),
      getAdviceById: this.createHandler('GetAdviceById', 'advices/get-advice-by-id.ts', commonProps),
      getAdvicesByTherapyId: this.createHandler('GetAdvicesByTherapyId', 'advices/get-advices-by-therapyId.ts', commonProps),
      updateAdvice: this.createHandler('UpdateAdvice', 'advices/update-advice.ts', commonProps),
      deleteAdvice: this.createHandler('DeleteAdvice', 'advices/delete-advice.ts', commonProps),
      createAppointment: this.createHandler('CreateAppointment', 'appointments/create-appointment.ts', commonProps),
      mediaUpload: this.createHandler('MediaUpload', 'core/media-upload.ts', commonProps)
    };

    const table = props.dbConstruct.dataTable;
    table.grantWriteData(this.handlers.createTherapy);
    table.grantReadData(this.handlers.getAllTherapies);
    table.grantReadData(this.handlers.getTherapyById);
    table.grantReadWriteData(this.handlers.updateTherapy);
    table.grantWriteData(this.handlers.deleteTherapy);
    table.grantWriteData(this.handlers.createAdvice);
    table.grantReadData(this.handlers.getAllAdvices);
    table.grantReadData(this.handlers.getAdviceById);
    table.grantReadData(this.handlers.getAdvicesByTherapyId);
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
      entry: path.join(__dirname, '..', '..', 'lambda', 'handlers', handlerFile),
      handler: 'handler',
    });
  }
}
