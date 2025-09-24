import { DatabaseService } from "../../lib/constructs/services/database-service";
import { ApiResponse, error, success } from "../shared/dynamo";
import { Appointment, AppointmentStatus } from "../shared/types/appointment";

const dbService = new DatabaseService<Appointment>(process.env.TABLE_NAME!);

export const handler = async (event: {
  pathParameters?: { appointmentId?: string };
  body?: string;
  requestContext?: {
    authorizer?: {
      claims?: {
        email?: string;
        sub?: string;
        ['cognito:groups']?: string;
      };
    };
  };
}): Promise<ApiResponse> => {
  const groups = event.requestContext?.authorizer?.claims?.['cognito:groups'] || '';

  if (!groups.includes('ADMIN')) {
    return error(403, 'Only admin can assign appointments');
  }

  try {
    const appointmentId = event.pathParameters?.appointmentId;
    const { userId } = JSON.parse(event.body || '{}') as { userId: string };

    if (!appointmentId || !userId) {
      return error(400, 'Appointment ID and User ID are required');
    }

    const appointment = await dbService.getItem(
      `APPOINTMENT#${appointmentId}`,
      `APPOINTMENT#${appointmentId}`
    );

    if (!appointment) {
      return error(404, 'Appointment not found');
    }

    if (appointment.status !== AppointmentStatus.AVAILABLE) {
      return error(400, 'Appointment is not available for assignment');
    }

    await dbService.updateItem(
      `APPOINTMENT#${appointmentId}`,
      `APPOINTMENT#${appointmentId}`,
      {
        status: AppointmentStatus.OCCUPIED,
        userId: userId,
      }
    );

    return success({ message: 'Appointment assigned successfully' });
  } catch (err) {
    console.error('Error assigning appointment:', err);
    return error(500, 'Internal Server Error');
  }
};
