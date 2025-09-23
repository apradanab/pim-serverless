import { DatabaseService } from "../../lib/constructs/services/database-service";
import { ApiResponse, error, success } from "../shared/dynamo";
import { User } from "../shared/types/user";

const dbService = new DatabaseService<User>(process.env.TABLE_NAME!);

export const handler = async (event: {
  requestContext?: {
    authorizer?: {
      claims?: {
        email?: string;
        sub?: string;
        ['cognito:groups']?: string;
      };
    };
  };
}): Promise<ApiResponse> => {
  const groups = event.requestContext?.authorizer?.claims?.["cognito:groups"] || '';

  if (!groups.includes('ADMIN')) {
    return error(403, 'Only Admins are authorized to list users')
  }

  try {
    const users = await dbService.queryByType('User');
    return success(users);
  } catch (err) {
    console.error('Error listing users:', err);
    return error(500, 'Internal Server Error');
  }
};
