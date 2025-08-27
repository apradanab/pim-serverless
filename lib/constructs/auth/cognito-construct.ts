import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';

export class CognitoConstruct extends Construct {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;
  public readonly adminGroup: cognito.CfnUserPoolGroup;
  public readonly userGroup: cognito.CfnUserPoolGroup;
  public readonly guestGroup: cognito.CfnUserPoolGroup;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.userPool = new cognito.UserPool(this, 'PimUserPool', {
      userPoolName: 'PIM-Users',
      signInAliases: { email: true },
      autoVerify: { email: true },

      standardAttributes: {
        givenName: { required: true, mutable: true },
        familyName: { required: true, mutable: true },
      },
      customAttributes: {
        role: new cognito.StringAttribute({ mutable: true }),
        approved: new cognito.BooleanAttribute({ mutable: true }),
        message: new cognito.StringAttribute({ mutable: true }),
      },
      passwordPolicy: {
        minLength: 8,
        requireDigits: true,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    })

    this.userPoolClient = this.userPool.addClient('PimWebClient', {
      authFlows: {
        userPassword: true,
        adminUserPassword: true,
      },
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
        },
        scopes: [
          cognito.OAuthScope.OPENID,
          cognito.OAuthScope.EMAIL,
          cognito.OAuthScope.PROFILE,
        ],
        callbackUrls: [
          'http://localhost:4200/home',
        ],
        logoutUrls: [
          'http://localhost:4200/login',
        ]
      },
      generateSecret: false,
      refreshTokenValidity: cdk.Duration.days(30),
      accessTokenValidity: cdk.Duration.hours(1),
      idTokenValidity: cdk.Duration.hours(1),
    });

    this.adminGroup = new cognito.CfnUserPoolGroup(this, 'PimAdminGroup', {
      userPoolId: this.userPool.userPoolId,
      groupName: 'ADMIN',
      description: 'Administrator with full access'
    });

    this.userGroup = new cognito.CfnUserPoolGroup(this, 'PimUsersGroup', {
      userPoolId: this.userPool.userPoolId,
      groupName: 'USER',
      description: 'Approved users with some access rights',
    });

    this.guestGroup = new cognito.CfnUserPoolGroup(this, 'PimGuestsGroup', {
      userPoolId: this.userPool.userPoolId,
      groupName: 'GUEST',
      description: 'Users pending approval with restricted access'
    });

    const cognitoDomain = this.userPool.addDomain('PimCognitoDomain', {
      cognitoDomain: {
        domainPrefix: `pim-${cdk.Stack.of(this).account}`
      }
    });

    new cdk.CfnOutput(this, 'PimUserPoolId', {
      value: this.userPool.userPoolId,
    });

    new cdk.CfnOutput(this, 'PimUserPoolClientId', {
      value: this.userPoolClient.userPoolClientId
    })

    new cdk.CfnOutput(this, 'PimCognitoDomain', {
      value: cognitoDomain.domainName
    });
}}
