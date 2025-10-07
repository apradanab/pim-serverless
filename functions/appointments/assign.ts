import { DatabaseService } from "../../lib/constructs/services/database-service";
import { EmailService } from "../../lib/constructs/services/email-service";
import { ApiResponse, error, success } from "../shared/dynamo";
import { Appointment, AppointmentStatus } from "../shared/types/appointment";
import { Therapy } from "../shared/types/therapy";
import { User } from "../shared/types/user";

const dbService = new DatabaseService<Appointment>(process.env.TABLE_NAME!);
const emailService = new EmailService({
  region: process.env.REGION!,
  sourceEmail: process.env.SOURCE_EMAIL!
});

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
  const groups = event.requestContext?.authorizer?.claims?.['cognito:groups'] || '';

  if (!groups.includes('ADMIN')) {
    return error(403, 'Only admin can assign appointments');
  }

  try {
    const therapyId = event.pathParameters?.therapyId;
    const appointmentId = event.pathParameters?.appointmentId;
    const { userEmail } = JSON.parse(event.body || '{}') as { userEmail: string };

    if (!therapyId || !appointmentId || !userEmail) {
      return error(400, 'Therapy, appointment, and user IDs are required');
    }

    const users = await dbService.queryByEmail(userEmail);
    const targetUser = users[0] as unknown as User;
    if (!targetUser) return error(404, 'User not found');

    const appointment = await dbService.getItem(
      `THERAPY#${therapyId}`,
      `APPOINTMENT#${appointmentId}`
    );

    if (!appointment) {
      return error(404, 'Appointment not found');
    }

    if (appointment.status !== AppointmentStatus.AVAILABLE) {
      return error(400, 'Appointment is not available for assignment');
    }

    await dbService.updateItem(
      `THERAPY#${therapyId}`,
      `APPOINTMENT#${appointmentId}`,
      {
        status: AppointmentStatus.OCCUPIED,
        userId: targetUser.cognitoId,
        userEmail: userEmail,
        GSI2PK: `USER#${targetUser.cognitoId}`,
        GSI2SK: `APPOINTMENT#${appointmentId}`,
      }
    );

    try {
      const therapy = await dbService.getItem(
        `THERAPY#${therapyId}`,
        `THERAPY#${therapyId}`
      );

      if (therapy) {
        const therapyData = therapy as unknown as Therapy;

        await emailService.sendAppointmentConfirmation(
          userEmail,
          targetUser.name || userEmail.split('@')[0],
          therapyData.title,
          appointment.date,
          `${appointment.startTime} - ${appointment.endTime}`
        );
      }
    } catch (err) {
      console.error('Failed to send confirmation email:', err);
    }

    return success({ message: 'Appointment assigned successfully' });
  } catch (err) {
    console.error('Error assigning appointment:', err);
    return error(500, 'Internal Server Error');
  }
};
