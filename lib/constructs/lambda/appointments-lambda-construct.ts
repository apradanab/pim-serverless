import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as path from 'path';
import { DynamoDBConstruct } from '../data/dynamodb-construct';
import * as iam from 'aws-cdk-lib/aws-iam';

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
  public readonly joinGroupAppointment: NodejsFunction;
  public readonly leaveGroupAppointment: NodejsFunction;
  public readonly listParticipants: NodejsFunction;
  public readonly completePastAppointments: NodejsFunction;
  public readonly deleteExpiredAppointments: NodejsFunction;

  constructor(scope: Construct, id: string, props: AppointmentsLambdaProps) {
    super(scope, id);

    this.createAppointment = this.createHandler('Create', 'appointments/create.ts', props);
    this.listAppointments = this.createHandler('List', 'appointments/list.ts', props);
    this.getAppointment = this.createHandler('Get', 'appointments/get.ts', props);
    this.updateAppointment = this.createHandler('Update', 'appointments/update.ts', props);
    this.deleteAppointment = this.createHandler('Delete', 'appointments/delete.ts', props);
    this.listAppointmentsByUser = this.createHandler('ListByUser', 'appointments/list-by-user.ts', props);
    this.requestAppointment = this.createHandler('Request', 'appointments/request.ts', props);
    this.approveAppointment = this.createHandler('Approve', 'appointments/approve.ts', props);
    this.assignAppointment = this.createHandler('Assign', 'appointments/assign.ts', props);
    this.requestCancellation = this.createHandler('RequestCancellation', 'appointments/request-cancellation.ts', props);
    this.approveCancellation = this.createHandler('ApproveCancellation', 'appointments/approve-cancellation.ts', props);
    this.joinGroupAppointment = this.createHandler('JoinGroup', 'appointments/join-group.ts', props);
    this.leaveGroupAppointment = this.createHandler('LeaveGroup', 'appointments/leave-group.ts', props);
    this.listParticipants = this.createHandler('ListParticipants', 'appointments/list-participants.ts', props);
    this.completePastAppointments = this.createHandler('CompletePast', 'appointments/complete-past.ts', props);
    this.deleteExpiredAppointments = this.createHandler('DeleteExpired', 'appointments/delete-expired.ts', props);

    const table = props.dbConstruct.dataTable;
    table.grantReadWriteData(this.createAppointment);
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
    table.grantReadWriteData(this.joinGroupAppointment);
    table.grantReadWriteData(this.leaveGroupAppointment);
    table.grantReadData(this.listParticipants);
    table.grantReadWriteData(this.completePastAppointments);
    table.grantReadWriteData(this.deleteExpiredAppointments);

    this.approveAppointment.addToRolePolicy(new iam.PolicyStatement({
      actions: ['ses:SendEmail', 'ses:SendRawEmail'],
      resources: ['*']
    }));

    this.approveCancellation.addToRolePolicy(new iam.PolicyStatement({
      actions: ['ses:SendEmail', 'ses:SendRawEmail'],
      resources: ['*']
    }));

    this.assignAppointment.addToRolePolicy(new iam.PolicyStatement({
      actions: ['ses:SendEmail', 'ses:SendRawEmail'],
      resources: ['*']
    }))
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
