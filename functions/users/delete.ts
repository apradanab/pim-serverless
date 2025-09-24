import { DatabaseService } from "../../lib/constructs/services/database-service";
import { ApiResponse, error, success } from "../shared/dynamo";

interface CognitoClaims {
  sub: string;
  ['cognito:groups']?: string[];
}

const dbService = new DatabaseService(process.env.TABLE_NAME!);

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
    await dbService.deleteItem(`USER#${userId}`, `USER#${userId}`);
    return success({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Error deleting user:', err);
    return error(500, 'Internal Server Error');
  }
}
