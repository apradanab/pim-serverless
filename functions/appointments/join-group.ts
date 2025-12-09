import { DatabaseService } from "../../lib/constructs/services/database-service";
import { ApiResponse, error, success } from "../shared/dynamo";
import { Appointment, AppointmentStatus } from "../shared/types/appointment";
import { User } from "../shared/types/user";

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
  try {
    const therapyId = event.pathParameters?.therapyId;
    const appointmentId = event.pathParameters?.appointmentId;
    const userId = event.requestContext?.authorizer?.claims?.sub;
    const userEmail = event.requestContext?.authorizer?.claims?.email;

    if (!therapyId || !appointmentId) {
      return error(400, 'Therapy and appointment IDs are required');
    }

    if (!userId || !userEmail) {
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
    const currentParticipants = appointment.currentParticipants || 0;

    if (maxParticipants <= 1) {
      return error(400, 'This appointment is not available for group joining');
    }

    if (appointment.status !== AppointmentStatus.AVAILABLE &&
        appointment.status !== AppointmentStatus.OCCUPIED) {
      return error(400, 'Appointment is not available for joining');
    }

    if (currentParticipants >= maxParticipants) {
      return error(400, 'Appointment is full');
    }

    const isAlreadyJoined = appointment.participants?.some(
      p => p.userId === userId
    );
    if (isAlreadyJoined) {
      return error(400, 'User already joined this appointment');
    }

    const users = await dbService.queryByEmail(userEmail);
    const targetUser = users[0] as unknown as User;
    if (!targetUser) {
      return error(404, 'User not found');
    }

    const updatedParticipants = [
      ...(appointment.participants || []),
      {
        userId,
        userEmail,
        userName: targetUser.name || userEmail.split('@')[0],
        joinedAt: new Date().toISOString(),
      }
    ];

    const updateData: Partial<Appointment> = {
      participants: updatedParticipants,
      currentParticipants: updatedParticipants.length
    };

    if (updatedParticipants.length === maxParticipants) {
      updateData.status = AppointmentStatus.OCCUPIED;
    }

    await dbService.updateItem(
      `THERAPY#${therapyId}`,
      `APPOINTMENT#${appointmentId}`,
      updateData
    );

    return success({
      message: 'Successfully joined group appointment',
      currentParticipants: updatedParticipants.length,
      maxParticipants: maxParticipants
    });

  } catch (err) {
    console.error('Error joining group appointment:', err);
    return error(500, 'Internal Server Error');
  }
};
