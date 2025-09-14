import { DatabaseService } from "../../lib/constructs/services/database-service";
import { ApiResponse, error, success } from "../shared/dynamo";
import { User } from "../shared/types/user";

const dbService = new DatabaseService<User>(process.env.TABLE_NAME!);

export const handler = async (event: {
  pathParameters?: { userId?: string };
}): Promise<ApiResponse> => {
  const userId = event.pathParameters?.userId;

  if (!userId) return error(400, 'Missing user id in path');

  try {
    const user = await dbService.getItem(
      `USER#${userId}`,
      `USER#${userId}`
    );

    if (!user) return error(404, 'User not found');

    return success(user);
  } catch (err) {
    console.error('Error fetching user:', err);
    return error(500, 'Internal Server Error');
  }
}
