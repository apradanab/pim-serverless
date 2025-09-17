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

    if(!appointmentId) return error(400, 'Appointment ID is required');

    const appointment = await dbService.getItem(
      `APPOINTMENT#${appointmentId}`,
      `APPOINTMENT#${appointmentId}`
    );

    if(!appointment) return error(404, 'Appointment not found');

    if (appointment.status !== AppointmentStatus.PENDING) {
      return error(400, 'Onli pending appointments are allowed for cancellation');
    }

    await dbService.updateItem(
      `APPOINTMENT#${appointmentId}`,
      `APPOINTMENT#${appointmentId}`,
      {
        status: AppointmentStatus.CANCELLED,
        userId: undefined
      }
    );

    return success({ message: 'Appointment cancelled successfully' });
  } catch (err) {
    console.error('Error approving cancellation:', err);
    return error(500, 'Internal Server Error');
  }
}
