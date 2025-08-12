import { DatabaseService } from "../../lib/constructs/services/database-service";
import { ApiResponse, error, success } from "../shared/dynamo";

const dbService = new DatabaseService(process.env.TABLE_NAME!);

export const handler = async (event: {
  pathParameters?: { therapyId?: string; appointmentId?: string };
}): Promise<ApiResponse> => {
  const { therapyId, appointmentId } = event.pathParameters || {};

  if (!therapyId || !appointmentId) return error(400, 'Therapy and appointment ids are required');

  try {
    await dbService.deleteItem(
      `THERAPY#${therapyId}`,
      `APPOINTMENT#${appointmentId}`
    )

    return success({ message: 'Appointment deleted'});
  } catch (err) {
    console.error('Error deleting appointment:', err);
    return error(500, 'Internal server Error');
  }
}
