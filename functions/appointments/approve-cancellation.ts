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
    return error(403, 'Only admin is authorized to create appointments');
  }

  try {
    const therapyId = event.pathParameters?.therapyId;
    const appointmentId = event.pathParameters?.appointmentId;

    if(!therapyId || !appointmentId) return error(400, 'Therapy and appointment IDs are required');

    const appointment = await dbService.getItem(
      `THERAPY#${therapyId}`,
      `APPOINTMENT#${appointmentId}`
    );

    if(!appointment) return error(404, 'Appointment not found');

    if (appointment.status !== AppointmentStatus.PENDING) {
      return error(400, 'Only pending appointments are allowed for cancellation');
    }

    await dbService.updateItem(
      `THERAPY#${therapyId}`,
      `APPOINTMENT#${appointmentId}`,
      {
        status: AppointmentStatus.CANCELLED,
      }
    );

    if (appointment.userEmail) {
      try {
        const therapy = await dbService.getItem(
          `THERAPY#${therapyId}`,
          `THERAPY#${therapyId}`
        );

        const users = await dbService.queryByEmail(appointment.userEmail);
        const targetUser = users[0] as unknown as User;

        if (therapy) {
          const therapyData = therapy as unknown as Therapy;

          await emailService.sendAppointmentCancellation(
            appointment.userEmail,
            targetUser.name || appointment.userEmail.split('@')[0],
            therapyData.title,
            appointment.date,
            `${appointment.startTime} - ${appointment.endTime}`
          );
        }
      } catch (err) {
        console.error('Failed to send cancellation email:',  err);
      }
    }

    return success({ message: 'Appointment cancelled successfully' });
  } catch (err) {
    console.error('Error approving cancellation:', err);
    return error(500, 'Internal Server Error');
  }
}
