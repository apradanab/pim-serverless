import { CognitoService } from "../../lib/constructs/services/cognito-service";
import { DatabaseService } from "../../lib/constructs/services/database-service";
import { ApiResponse, error, success } from "../shared/dynamo";
import { User } from "../shared/types/user";

interface CognitoClaims {
  sub: string;
  ['cognito:groups']?: string[];
}

const dbService = new DatabaseService<User>(process.env.TABLE_NAME!);
const cognitoService = new CognitoService({
  userPoolId: process.env.USER_POOL_ID!,
  clientId: process.env.USER_POOL_CLIENT_ID!,
  region: process.env.REGION!
});

export const handler = async (event: {
  pathParameters?: { userId?: string };
  requestContext?: {
    authorizer?: {
      claims?: CognitoClaims;
    };
  };
}): Promise<ApiResponse> => {
  const userId = event.pathParameters?.userId;
  const claims = event.requestContext?.authorizer?.claims;

  if (!userId) return error(400, 'Missing user id in path');
  if (!claims) return error(403, 'Unauthorized');

  const isAdmin = claims['cognito:groups']?.includes('ADMIN') ?? false;
  const isOwner = claims.sub === userId;

  if (!isAdmin && !isOwner) return error(403, 'You are not allowed to delete this user');

  try {
    const user = await dbService.getItem(`USER#${userId}`, `USER#${userId}`);
    if (!user) return error(404, 'User not found');

    if (user.approved) {
      try {
        await cognitoService.deleteUser(user.email);
      } catch (cognitoErr: unknown) {
        if (!(cognitoErr instanceof Error) || cognitoErr.name !== 'UserNotFoundException') {
          throw cognitoErr;
        }
      }
    }

    await dbService.deleteItem(`USER#${userId}`, `USER#${userId}`);

    return success({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Error deleting user:', err);
    return error(500, 'Internal Server Error');
  }
}
