import {
  CognitoIdentityProviderClient,
  AdminInitiateAuthCommand,
  AdminInitiateAuthCommandOutput,
  AdminInitiateAuthCommandInput,
} from '@aws-sdk/client-cognito-identity-provider';

interface CognitoConfig {
  userPoolId: string;
  clientId: string;
  region: string;
}

export class CognitoService {
  private readonly client: CognitoIdentityProviderClient;

  constructor(private readonly config: CognitoConfig) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
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

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    const command = new AdminInitiateAuthCommand(input)

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const response: AdminInitiateAuthCommandOutput = await this.client.send(command);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const token = response.AuthenticationResult?.IdToken;
    if (!token) {
      throw new Error('No authentication token received');
    }

    return token as string;
  }
}
