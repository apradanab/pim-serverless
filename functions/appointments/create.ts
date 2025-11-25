import { ApiResponse, error, success } from '../shared/dynamo';
import { v4 as uuidv4 } from 'uuid';
import { Appointment, AppointmentStatus, CreateAppointmentInput } from '../shared/types/appointment';
import { DatabaseService } from '../../lib/constructs/services/database-service';
import { Therapy } from '../shared/types/therapy';

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
    const therapy = await dbService.getItem(
      `THERAPY#${therapyId}`,
      `THERAPY#${therapyId}`
    ) as unknown as Therapy;

    if (!therapy) return error(404, 'Therapy not found');

    const appointmentId = uuidv4();
    const maxParticipants = input.maxParticipants || therapy.maxParticipants;

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
      maxParticipants,
      currentParticipants: 0,
      participants: [],
      status: AppointmentStatus.AVAILABLE,
      notes: input.notes,
      createdAt: new Date().toISOString(),
    };

    await dbService.createItem(newAppointment);

    return success(newAppointment);
  } catch (err) {
    console.error('Error creating appointment', err);
    return error(500, 'Internal Server Error');
  }
}
