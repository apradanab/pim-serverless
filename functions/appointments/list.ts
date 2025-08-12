import { DatabaseService } from "../../lib/constructs/services/database-service";
import { ApiResponse, error, success } from "../shared/dynamo";
import { Appointment } from "../shared/types/appointment";

const dbService = new DatabaseService<Appointment>(process.env.TABLE_NAME!);

export const handler = async (): Promise<ApiResponse> => {
  try {
    const appointments = await dbService.queryByType('Appointment');

    return success(appointments)
  } catch (err) {
    console.error('Error fetching appointments:', err);
    return error(500, 'Internal Server Error');
  }
}
