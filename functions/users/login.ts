import { ApiResponse, error, success } from '../shared/dynamo';
import { CognitoService } from '../../lib/constructs/services/cognito-service';
import { DatabaseService } from '../../lib/constructs/services/database-service';
import { User, LoginInput } from '../shared/types/user';

const cognitoService = new CognitoService({
  userPoolId: process.env.USER_POOL_ID!,
  clientId: process.env.USER_POOL_CLIENT_ID!,
  region: process.env.REGION!,
});

const dbService = new DatabaseService<User>(process.env.TABLE_NAME!);

export const handler = async (event: { body?: string }): Promise<ApiResponse> => {
  try {
    const { email, password } = JSON.parse(event.body || '{}') as LoginInput;

    if (!email || !password) {
      return error(400, 'Email and password are required');
    }

    const token = await cognitoService.login(email, password);

    const users = await dbService.queryByEmail(email);

    if (users.length === 0) {
      return error(404, 'User not found');
    }

    const user = users[0];

    return success({
      token,
      user: {
        id: user.userId,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar || null,
        approved: user.approved,
      }
    });

  } catch (err) {
    console.error('Login error:', err);
    return error(401, 'Invalid credentials');
  }
};
