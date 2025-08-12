import { DatabaseService } from "../../lib/constructs/services/database-service";
import { ApiResponse, error, success } from "../shared/dynamo";
import { Appointment, UpdateAppointmentInput } from "../shared/types/appointment";

const dbService = new DatabaseService<Appointment>(process.env.TABLE_NAME!);

export const handler = async (event: {
  pathParameters?: { therapyId?: string; appointmentId?: string },
  body?: string
}): Promise<ApiResponse> => {
  const therapyId = event.pathParameters?.therapyId;
  const appointmentId = event.pathParameters?.appointmentId;

  if (!therapyId || !appointmentId) return error(400, 'Therapy and appointment ids are required');

  const input = JSON.parse(event.body || '{}') as UpdateAppointmentInput;

  try {
    await dbService.updateItem(
      `THERAPY#${therapyId}`,
      `APPOINTMENT#${appointmentId}`,
      input
    );

    return success({ messsage: 'Appointment updated successfully'});
  } catch (err) {
    console.error('Error updating appointment:', err);
    return error(500, 'Internal Server Error');
  }
}
