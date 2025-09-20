import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as path from 'path';
import { DynamoDBConstruct } from '../data/dynamodb-construct';

interface AppointmentsLambdaProps {
  dbConstruct: DynamoDBConstruct;
  commonEnv: Record<string, string>;
  commonProps: Partial<NodejsFunctionProps>;
}

export class AppointmentsLambdaConstruct extends Construct {
  public readonly createAppointment: NodejsFunction;
  public readonly listAppointments: NodejsFunction;
  public readonly getAppointment: NodejsFunction;
  public readonly updateAppointment: NodejsFunction;
  public readonly deleteAppointment: NodejsFunction;
  public readonly listAppointmentsByUser: NodejsFunction;
  public readonly requestAppointment: NodejsFunction;
  public readonly approveAppointment: NodejsFunction;
  public readonly assignAppointment: NodejsFunction;
  public readonly requestCancellation: NodejsFunction;
  public readonly approveCancellation: NodejsFunction;

  constructor(scope: Construct, id: string, props: AppointmentsLambdaProps) {
    super(scope, id);

    this.createAppointment = this.createHandler('CreateAppointment', 'appointments/create.ts', props);
    this.listAppointments = this.createHandler('ListAppointments', 'appointments/list.ts', props);
    this.getAppointment = this.createHandler('GetAppointment', 'appointments/get.ts', props);
    this.updateAppointment = this.createHandler('UpdateAppointment', 'appointments/update.ts', props);
    this.deleteAppointment = this.createHandler('DeleteAppointment', 'appointments/delete.ts', props);
    this.listAppointmentsByUser = this.createHandler('ListAppointmentsByUser', 'appointments/list-by-user.ts', props);
    this.requestAppointment = this.createHandler('RequestAppointment', 'appointments/request.ts', props);
    this.approveAppointment = this.createHandler('ApproveAppointment', 'appointments/approve.ts', props);
    this.assignAppointment = this.createHandler('AssignAppointment', 'appointments/assign.ts', props);
    this.requestCancellation = this.createHandler('RequestCancellation', 'appointments/request-cancellation.ts', props);
    this.approveCancellation = this.createHandler('ApproveCancellation', 'appointments/approve-cancellation.ts', props);

    const table = props.dbConstruct.dataTable;
    table.grantWriteData(this.createAppointment);
    table.grantReadData(this.listAppointments);
    table.grantReadData(this.getAppointment);
    table.grantReadWriteData(this.updateAppointment);
    table.grantWriteData(this.deleteAppointment);
    table.grantReadData(this.listAppointmentsByUser);
    table.grantReadWriteData(this.requestAppointment);
    table.grantReadWriteData(this.approveAppointment);
    table.grantReadWriteData(this.assignAppointment);
    table.grantReadWriteData(this.requestCancellation);
    table.grantReadWriteData(this.approveCancellation);
  }

  private createHandler(id: string, handlerFile: string, props: AppointmentsLambdaProps): NodejsFunction {
    return new NodejsFunction(this, id, {
      runtime: lambda.Runtime.NODEJS_22_X,
      environment: props.commonEnv,
      entry: path.join(__dirname, '..', '..', '..','functions', handlerFile),
      handler: 'handler',
      ...props.commonProps,
    });
  }
}
