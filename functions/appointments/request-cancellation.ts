import { DatabaseService } from "../../lib/constructs/services/database-service";
import { ApiResponse, error, success } from "../shared/dynamo";
import { Appointment, AppointmentStatus } from "../shared/types/appointment";

const dbService = new DatabaseService<Appointment>(process.env.TABLE_NAME!);

export const handler = async (event: {
  pathParameters?: { therapyId?: string; appointmentId?: string };
  body?: string;
  requestContext?: {
    authorizer?: {
      claims?: {
        sub?: string;
      };
    };
  };
}): Promise<ApiResponse> => {
  try {
    const therapyId = event.pathParameters?.therapyId;
    const appointmentId = event.pathParameters?.appointmentId;
    const { notes } = JSON.parse(event.body || '{}') as { notes: string };
    const userId = event.requestContext?.authorizer?.claims?.sub;

    if(!therapyId || !appointmentId) return error(400, 'Therapy and appointment IDs are required');
    if(!notes) return error(400, 'Cancellation reason is required');
    if(!userId) return error(401, 'User authentication required');

    const appointment = await dbService.getItem(
      `THERAPY#${therapyId}`,
      `APPOINTMENT#${appointmentId}`
    );

    if(!appointment) return error(404, 'Appointment not found');
    if(appointment.userId !== userId) {
      return error(403, 'You are not allowed to cancel this appointment');
    }

    await dbService.updateItem(
      `THERAPY#${therapyId}`,
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
