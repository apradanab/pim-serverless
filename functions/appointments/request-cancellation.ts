import { DatabaseService } from "../../lib/constructs/services/database-service";
import { ApiResponse, error, success } from "../shared/dynamo";
import { Appointment, AppointmentStatus } from "../shared/types/appointment";

const dbService = new DatabaseService<Appointment>(process.env.TABLE_NAME!);

export const handler = async (event: {
  pathParameters?: { appointmentId?: string };
  body?: string;
}): Promise<ApiResponse> => {
  try {
    const appointmentId = event.pathParameters?.appointmentId;
    const { notes } = JSON.parse(event.body || '{}') as { notes: string };

    if(!appointmentId) return error(400, 'Appointment ID is required');

    if(!notes) return error(400, 'Cancellation reason is required');

    const appointment = await dbService.getItem(
      `APPOINTMENT#${appointmentId}`,
      `APPOINTMENT#${appointmentId}`
    );

    if(!appointment) return error(404, 'Appointment not found');

    await dbService.updateItem(
      `APPOINTMENT#${appointmentId}`,
      `APPOINTMENT#${appointmentId}`,
      {
        status: AppointmentStatus.PENDING,
        notes,
      }
    );

    return success({ message: 'Cancellation requested successfully' });
  } catch (err) {
    console.error('Error requesting cancellation:', err);
    return error(500, 'Internal Server Error');
  }
}
