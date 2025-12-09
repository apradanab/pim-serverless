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
        email?: string;
        sub?: string;
        ['cognito:groups']?: string;
      };
    };
  };
}): Promise<ApiResponse> => {
  try {
    const therapyId = event.pathParameters?.therapyId;
    const appointmentId = event.pathParameters?.appointmentId;
    const userId = event.requestContext?.authorizer?.claims?.sub;

    if (!therapyId || !appointmentId) {
      return error(400, 'Therapy and appointment IDs are required');
    }

    if (!userId) {
      return error(401, 'User authentication required');
    }

    const appointment = await dbService.getItem(
      `THERAPY#${therapyId}`,
      `APPOINTMENT#${appointmentId}`
    );

    if (!appointment) {
      return error(404, 'Appointment not found');
    }

    const maxParticipants = appointment.maxParticipants || 1;
    if (maxParticipants <= 1) {
      return error(400, 'This appointment is not available for group operations');
    }

    const currentParticipants = appointment.participants || [];
    const isParticipant = currentParticipants.some(p => p.userId === userId);

    if (!isParticipant) {
      return error(400, 'User is not actively joined to this appointment');
    }

    const updatedParticipants = currentParticipants.filter(p => p.userId !== userId);
    const activeParticipantsLength = updatedParticipants.length;

    const updateData: Partial<Appointment> = {
      participants: updatedParticipants,
      currentParticipants: activeParticipantsLength
    };

    if (appointment.status === AppointmentStatus.OCCUPIED &&
        activeParticipantsLength < maxParticipants) {
      updateData.status = AppointmentStatus.AVAILABLE;
    }

    await dbService.updateItem(
      `THERAPY#${therapyId}`,
      `APPOINTMENT#${appointmentId}`,
      updateData
    );

    return success({
      message: 'Successfully cancelled group appointment participation',
      currentParticipants: activeParticipantsLength,
      maxParticipants: maxParticipants
    });

  } catch (err) {
    console.error('Error cancelling group appointment participation:', err);
    return error(500, 'Internal Server Error');
  }
};
