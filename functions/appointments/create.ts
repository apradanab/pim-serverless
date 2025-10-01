import { ApiResponse, error, success } from '../shared/dynamo';
import { v4 as uuidv4 } from 'uuid';
import { Appointment, CreateAppointmentInput } from '../shared/types/appointment';
import { DatabaseService } from '../../lib/constructs/services/database-service';

const dbService = new DatabaseService<Appointment>(process.env.TABLE_NAME!);

export const handler = async (event: {
  pathParameters?: { therapyId?: string };
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

  const therapyId = event.pathParameters?.therapyId;
  const input = JSON.parse(event.body || '{}') as CreateAppointmentInput;

  if (!therapyId || !input.date || !input.startTime || !input.endTime) {
    return error(400, 'Missing required fields');
  }

  try {
    const appointmentId = uuidv4();
    const newAppointment: Appointment = {
      PK: `THERAPY#${therapyId}`,
      SK: `APPOINTMENT#${appointmentId}`,
      Type: 'Appointment',
      GSI1PK: `APPOINTMENT#${appointmentId}`,
      GSI1SK: `DATE#${input.date}`,
      GSI2PK: `USER#`,
      GSI2SK: `APPOINTMENT#${appointmentId}`,
      appointmentId,
      therapyId,
      date: input.date,
      startTime: input.startTime,
      endTime: input.endTime,
      status: 'AVAILABLE',
      notes: input.notes,
      createdAt: new Date().toISOString(),
    };

    await dbService.createItem(newAppointment);

    return success({
      message: 'Appointment created successfully',
      data: {
        appointmentId,
        therapyId,
      },
    });
  } catch (err) {
    console.error('Error creating appointment', err);
    return error(500, 'Internal Server Error');
  }
}
