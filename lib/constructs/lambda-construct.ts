import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as path from 'path';
import { Construct } from 'constructs';
import { DynamoDBConstruct } from './dynamodb-construct';

interface LambdaConstructProps {
  dbConstruct: DynamoDBConstruct;
}

type LambdaHandlers = {
  createTherapy: NodejsFunction;
  getAllTherapies: NodejsFunction;
  getTherapyById: NodejsFunction;
  updateTherapy: NodejsFunction;
  deleteTherapy: NodejsFunction;
  createAdvice: NodejsFunction;
};

export class LambdaConstruct extends Construct {
  public readonly handlers: LambdaHandlers;

  constructor(scope: Construct, id: string, props: LambdaConstructProps) {
    super(scope, id);

    const commonEnv = {
      TABLE_NAME: props.dbConstruct.dataTable.tableName,
    }

    const commonProps = {
      runtime: lambda.Runtime.NODEJS_LATEST,
      environment: commonEnv
    }

    this.handlers = {
      createTherapy: this.createHandler('CreateTherapy', 'therapies/create-therapy.ts', commonProps),
      getAllTherapies: this.createHandler('GetAllTherapies', 'therapies/get-all-therapies.ts', commonProps),
      getTherapyById: this.createHandler('GetTherapyById', 'therapies/get-therapy-by-id.ts', commonProps),
      updateTherapy: this.createHandler('UpdateTherapy', 'therapies/update-therapy.ts', commonProps),
      deleteTherapy: this.createHandler('DeleteTherapy', 'therapies/delete-therapy.ts', commonProps),
      createAdvice: this.createHandler('CreateAdvice', 'advices/create-advice.ts', commonProps),
    };

    const table = props.dbConstruct.dataTable;
    table.grantReadWriteData(this.handlers.createTherapy);
    table.grantReadData(this.handlers.getAllTherapies);
    table.grantReadData(this.handlers.getTherapyById);
    table.grantReadWriteData(this.handlers.updateTherapy);
    table.grantWriteData(this.handlers.deleteTherapy);
    table.grantWriteData(this.handlers.createAdvice);
  }

  private createHandler(id: string, handlerFile: string, props: Partial<NodejsFunctionProps>): NodejsFunction {
    return new NodejsFunction(this, id, {
      ...props,
      entry: path.join(__dirname, '..', '..', 'lambda', 'handlers', handlerFile),
      handler: 'handler',
    });
  }
}
