import { DatabaseService } from "../../lib/constructs/services/database-service";
import { ApiResponse, error, success } from "../shared/dynamo";
import { Appointment } from "../shared/types/appointment";

const dbService = new DatabaseService<Appointment>(process.env.TABLE_NAME!);

export const handler = async (event: {
  pathParameters?: { userId?: string };
}): Promise<ApiResponse> => {
  try {
    const userId = event.pathParameters?.userId;

    if(!userId) return error(400, 'User ID is required');

    const appointments = await dbService.queryByUserId(userId);

    return success(appointments);
  } catch (err) {
    console.error(`Error fetching user appointments`, err);
    return error(500, 'Internal Server Error');
  }
};
