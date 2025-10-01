import { DatabaseService } from "../../lib/constructs/services/database-service";
import { ApiResponse, error, success } from "../shared/dynamo";
import { Appointment, AppointmentStatus } from "../shared/types/appointment";

const dbService = new DatabaseService<Appointment>(process.env.TABLE_NAME!);

export const handler = async (event: {
  pathParameters?: { therapyId: string; appointmentId?: string };
  requestContext?: {
    authorizer?: {
      claims?: {
        sub?: string;
        email?: string;
      };
    };
  };
}): Promise<ApiResponse> => {
  try {
    const therapyId = event.pathParameters?.therapyId;
    const appointmentId = event.pathParameters?.appointmentId;
    const userId = event.requestContext?.authorizer?.claims?.sub;
    const userEmail = event.requestContext?.authorizer?.claims?.email;

    if(!therapyId || !appointmentId) return error(400, 'Therapy and appointment ID are required');

    if(!userId) return error(401, 'User authentication required');

    const  appointment = await dbService.getItem(
      `THERAPY#${therapyId}`,
      `APPOINTMENT#${appointmentId}`
    );

    if (!appointment) return error(404, 'Appointmetn not found');

    if (appointment.status !== AppointmentStatus.AVAILABLE) {
      return error(400, 'Appointment is nor available for booking');
    }

    await dbService.updateItem(
      `THERAPY#${therapyId}`,
      `APPOINTMENT#${appointmentId}`,
      {
        status: AppointmentStatus.PENDING,
        userId: userId,
        userEmail: userEmail,
        GSI2PK: `USER#${userId}`,
        GSI2SK: `APPOINTMENT#${appointmentId}`,
        requestedAt: new Date().toISOString(),
      }
    );

    return success({
      message: 'Appointment booking requested successfully',
      appointmentId,
      status: AppointmentStatus.PENDING
    })

  } catch (err) {
    console.error('Error creating appointment booking', err);
    return error(500, 'Internal Server Error');
  }
}
