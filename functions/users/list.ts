import { DatabaseService } from "../../lib/constructs/services/database-service";
import { ApiResponse, error, success } from "../shared/dynamo";
import { User } from "../shared/types/user";

const dbService = new DatabaseService<User>(process.env.TABLE_NAME!);

export const handler = async (): Promise<ApiResponse> => {
  try {
    const users = await dbService.queryByType('User');
    return success(users);
  } catch (err) {
    console.error('Error listing users:', err);
    return error(500, 'Internal Server Error');
  }
};
