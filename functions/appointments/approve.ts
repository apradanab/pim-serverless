import { DatabaseService } from "../../lib/constructs/services/database-service";
import { ApiResponse, error, success } from "../shared/dynamo";
import { Appointment, AppointmentStatus } from "../shared/types/appointment";

const dbService = new DatabaseService<Appointment>(process.env.TABLE_NAME!);

export const handler = async (event: {
  pathParameters?: { therapyId?: string; appointmentId?: string };
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
    return error(403, 'Only admin is authorized to create appointments');
  }

  try {
    const therapyId = event.pathParameters?.therapyId;
    const appointmentId = event.pathParameters?.appointmentId;

    if (!therapyId || !appointmentId) {
      return error(400, 'Therapy and appointment IDs are required');
    }

    const appointment = await dbService.getItem(
      `THERAPY#${therapyId}`,
      `APPOINTMENT#${appointmentId}`
    );

    if (!appointment) {
      return error(404, 'Appointment not found');
    }

    await dbService.updateItem(
      `THERAPY#${therapyId}`,
      `APPOINTMENT#${appointmentId}`,
      {
        status: AppointmentStatus.OCCUPIED
      }
    );

    return success({ message: 'Appointment approved successfully' });
  } catch (err) {
    console.error('Error approving appointment:', err);
    return error(500, 'Internal Server Error');
  }
};
