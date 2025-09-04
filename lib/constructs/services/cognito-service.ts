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
}
