import { DatabaseService } from "../../lib/constructs/services/database-service";
import { ApiResponse, error, success } from "../shared/dynamo";

const dbService = new DatabaseService(process.env.TABLE_NAME!);

export const handler = async (event: {
  pathParameters?: { userId?: string };
}): Promise<ApiResponse> => {
  const userId = event.pathParameters?.userId;

  if (!userId) return error(400, 'Missing user id in path');

  try {
    await dbService.deleteItem(`USER#${userId}`, `USER#${userId}`);
    return success({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Error deleting user:', err);
    return error(500, 'Internal Server Error');
  }
}
