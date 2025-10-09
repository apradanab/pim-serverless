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
    const { cancellationReason } = JSON.parse(event.body || '{}') as { cancellationReason?: string };

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
    const userParticipant = currentParticipants.find(p =>
      p.userId === userId && p.status === 'CONFIRMED'
    );

    if (!userParticipant) {
      return error(400, 'User is not actively joined to this appointment');
    }

    const updatedParticipants = currentParticipants.map(p =>
      p.userId === userId
        ? {
            ...p,
            status: 'CANCELLED' as const,
            cancelledAt: new Date().toISOString(),
            cancellationReason: cancellationReason
          }
        : p
    );

    const activeParticipants = updatedParticipants.filter(p => p.status === 'CONFIRMED');

    const updateData: Partial<Appointment> = {
      participants: updatedParticipants,
      currentParticipants: activeParticipants.length
    };

    if (appointment.status === AppointmentStatus.OCCUPIED &&
        activeParticipants.length < maxParticipants) {
      updateData.status = AppointmentStatus.AVAILABLE;
    }

    await dbService.updateItem(
      `THERAPY#${therapyId}`,
      `APPOINTMENT#${appointmentId}`,
      updateData
    );

    return success({
      message: 'Successfully cancelled group appointment participation',
      currentParticipants: activeParticipants.length,
      maxParticipants: maxParticipants
    });

  } catch (err) {
    console.error('Error cancelling group appointment participation:', err);
    return error(500, 'Internal Server Error');
  }
};
