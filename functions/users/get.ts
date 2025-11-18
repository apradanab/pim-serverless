import { DatabaseService } from "../../lib/constructs/services/database-service";
import { ApiResponse, error, success } from "../shared/dynamo";
import { User } from "../shared/types/user";

const dbService = new DatabaseService<User>(process.env.TABLE_NAME!);

export const handler = async (event: {
  pathParameters?: { userId?: string };
  requestContext: {
    authorizer: {
      claims: { email: string }
    }
  }
}): Promise<ApiResponse> => {
  const email = event.requestContext.authorizer.claims.email;

  if (!email) return error(401, 'Authorization context error: Email not found');

  try {
    const result = await dbService.queryByEmail(email);

    if (!result || result.length === 0) return error(404, 'User profile not found in database for this email');

    const user = result[0];

    return success(user);
  } catch (err) {
    console.error('Error fetching user:', err);
    return error(500, 'Internal Server Error');
  }
}
