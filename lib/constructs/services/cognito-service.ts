import {
  CognitoIdentityProviderClient,
  AdminInitiateAuthCommand,
  AdminInitiateAuthCommandOutput,
  AdminInitiateAuthCommandInput,
  AdminCreateUserCommand,
  AdminCreateUserCommandInput,
  AdminSetUserPasswordCommandInput,
  AdminSetUserPasswordCommand,
  AdminDeleteUserCommand,
  AdminUpdateUserAttributesCommandInput,
  AdminUpdateUserAttributesCommand,
} from '@aws-sdk/client-cognito-identity-provider';

interface CognitoConfig {
  userPoolId: string;
  clientId: string;
  region: string;
}

export class CognitoService {
  private readonly client: CognitoIdentityProviderClient;

  constructor(private readonly config: CognitoConfig) {
    this.client = new CognitoIdentityProviderClient({
      region: this.config.region,
    });
  }

  async login(email: string, password: string): Promise<string> {
    const input: AdminInitiateAuthCommandInput = {
      UserPoolId: this.config.userPoolId,
      ClientId: this.config.clientId,
      AuthFlow: 'ADMIN_USER_PASSWORD_AUTH',
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
      },
    };

    const command = new AdminInitiateAuthCommand(input)
    const response: AdminInitiateAuthCommandOutput = await this.client.send(command);

    const token = response.AuthenticationResult?.IdToken;
    if (!token) {
      throw new Error('No authentication token received');
    }

    return token;
  }

  async asignInitialPassword(email: string, password: string) {
    const input: AdminCreateUserCommandInput = {
      UserPoolId: this.config.userPoolId,
      Username: email,
      TemporaryPassword: password,
      MessageAction: 'SUPPRESS',
      UserAttributes: [
        { Name: 'email', Value: email },
        { Name: 'email_verified', Value: 'true' },
      ],
    };

    const command = new AdminCreateUserCommand(input);
    await this.client.send(command);
  }

  async setUserPassword(email: string, password: string) {
    const input: AdminSetUserPasswordCommandInput = {
      UserPoolId: this.config.userPoolId,
      Username: email,
      Password: password,
      Permanent: true,
    };

    const command = new AdminSetUserPasswordCommand(input);
    await this.client.send(command);
  }

  async updateUserAttribute(email: string, attributeName: string, attributeValue: string) {
    const input: AdminUpdateUserAttributesCommandInput = {
      UserPoolId: this.config.userPoolId,
      Username: email,
      UserAttributes: [
        {
          Name: attributeName,
          Value: attributeValue,
        },
      ],
    };

    const command = new AdminUpdateUserAttributesCommand(input);
    await this.client.send(command);
  }

  async deleteUser(email: string) {
    await this.client.send(new AdminDeleteUserCommand({
      UserPoolId: this.config.userPoolId,
      Username: email,
    }));
  }
}
