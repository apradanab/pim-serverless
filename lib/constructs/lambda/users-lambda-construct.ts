import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as path from 'path';
import { DynamoDBConstruct } from '../data/dynamodb-construct';
import { MediaBucket } from '../storage/media-bucket';
import { CognitoConstruct } from '../auth/cognito-construct';
import * as iam from 'aws-cdk-lib/aws-iam';

interface UsersLambdaProps {
  dbConstruct: DynamoDBConstruct;
  storageConstruct: MediaBucket;
  authConstruct: CognitoConstruct;
  commonEnv: Record<string, string>;
  commonProps: Partial<NodejsFunctionProps>;
}

export class UsersLambdaConstruct extends Construct {
  public readonly createUser: NodejsFunction;
  public readonly approveUser: NodejsFunction;
  public readonly completeRegistration: NodejsFunction;
  public readonly updateUser: NodejsFunction;
  public readonly loginUser: NodejsFunction;
  public readonly listUsers: NodejsFunction;
  public readonly getUser: NodejsFunction;
  public readonly deleteUser: NodejsFunction;

  constructor(scope: Construct, id: string, props: UsersLambdaProps) {
    super(scope, id);

    this.createUser = this.createHandler('Create', 'users/create.ts', props);
    this.approveUser = this.createHandler('Approve', 'users/approve.ts', props);
    this.completeRegistration = this.createHandler('CompleteRegistration', 'users/complete-registration.ts', props);
    this.updateUser = this.createHandler('Update', 'users/update.ts', props);
    this.loginUser = this.createHandler('Login', 'users/login.ts', props);
    this.listUsers = this.createHandler('List', 'users/list.ts', props);
    this.getUser = this.createHandler('Get', 'users/get.ts', props);
    this.deleteUser = this.createHandler('Delete', 'users/delete.ts', props);

    const table = props.dbConstruct.dataTable;
    table.grantReadWriteData(this.createUser);
    table.grantReadWriteData(this.approveUser);
    table.grantReadWriteData(this.completeRegistration);
    table.grantReadWriteData(this.updateUser);
    table.grantReadData(this.loginUser);
    table.grantReadData(this.getUser);
    table.grantReadData(this.listUsers);
    table.grantReadWriteData(this.deleteUser);

    const bucket = props.storageConstruct.bucket;
    bucket.grantReadWrite(this.completeRegistration);
    bucket.grantRead(this.updateUser);
    bucket.grantWrite(this.updateUser);

    props.authConstruct.userPool.grant(
      this.loginUser,
      'cognito-idp:AdminInitiateAuth'
    );
    props.authConstruct.userPool.grant(
      this.approveUser,
      'cognito-idp:AdminCreateUser',
      'cognito-idp:AdminSetUserPassword'
    );
    props.authConstruct.userPool.grant(
      this.completeRegistration,
      'cognito-idp:AdminSetUserPassword'
    )
    props.authConstruct.userPool.grant(
      this.updateUser,
      'cognito-idp:AdminSetUserPassword'
    );
    props.authConstruct.userPool.grant(
      this.deleteUser,
      'cognito-idp:AdminDeleteUser'
    );

    this.approveUser.addToRolePolicy(new iam.PolicyStatement({
      actions: ['ses:SendEmail', 'ses:SendRawEmail'],
      resources: ['*']
    }));
  }

  private createHandler(id: string, handlerFile: string, props: UsersLambdaProps): NodejsFunction {
    return new NodejsFunction(this, id, {
      runtime: lambda.Runtime.NODEJS_22_X,
      environment: props.commonEnv,
      entry: path.join(__dirname, '..', '..', '..','functions', handlerFile),
      handler: 'handler',
      ...props.commonProps,
    });
  }
}
