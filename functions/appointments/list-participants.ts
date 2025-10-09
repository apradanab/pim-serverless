import { DatabaseService } from "../../lib/constructs/services/database-service";
import { ApiResponse, error, success } from "../shared/dynamo";
import { Appointment } from "../shared/types/appointment";

const dbService = new DatabaseService<Appointment>(process.env.TABLE_NAME!);

export const handler = async (event: {
  pathParameters?: { therapyId?: string; appointmentId?: string };
}): Promise<ApiResponse> => {
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

    if (!appointment) return error(404, 'Appointment not found');

    const allParticipants = appointment.participants || [];

    return success({
      confirmedParticipants: allParticipants.filter(p => p.status === 'CONFIRMED'),
      cancelledParticipants: allParticipants.filter(p => p.status === 'CANCELLED'),
      maxParticipants: appointment.maxParticipants || 1,
    });
  } catch (err) {
    console.error('Error fetching participants:', err);
    return error(500, 'Internal Server Error');
  }
};
