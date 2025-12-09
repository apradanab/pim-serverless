import { DatabaseService } from "../../lib/constructs/services/database-service";
import { ApiResponse, error, success } from "../shared/dynamo";
import { Appointment, UpdateAppointmentInput } from "../shared/types/appointment";

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
  const groups = event.requestContext?.authorizer?.claims?.['cognito:groups'] || '';

  if (!groups.includes('ADMIN')) {
    return error(403, 'Only admin is authorized to update appointments');
  }

  const therapyId = event.pathParameters?.therapyId;
  const appointmentId = event.pathParameters?.appointmentId;

  if (!therapyId || !appointmentId) return error(400, 'Therapy and appointment ids are required');

  const input = JSON.parse(event.body || '{}') as UpdateAppointmentInput;

  if (!('notes' in input)) {
    return error(400, 'The notes field is required');
  }

  try {
    await dbService.updateItem(
      `THERAPY#${therapyId}`,
      `APPOINTMENT#${appointmentId}`,
      input
    );

    const updatedAppt = await dbService.getItem(
      `THERAPY#${therapyId}`,
      `APPOINTMENT#${appointmentId}`
    );

    return success(updatedAppt);
  } catch (err) {
    console.error('Error updating appointment:', err);
    return error(500, 'Internal Server Error');
  }
}
