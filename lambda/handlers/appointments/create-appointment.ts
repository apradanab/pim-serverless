import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { ApiResponse, success, error } from '../shared/responses';
import { v4 as uuidv4 } from 'uuid';
import { CreateAppointmentInput } from '../shared/types/appointment';
import { docClient } from '../shared/db-client';

export const handler = async (event: {
  pathParameters?: { therapyId?: string },
  body?: string
}): Promise<ApiResponse> => {
  const therapyId = event.pathParameters?.therapyId;
  const input = JSON.parse(event.body || '{}') as CreateAppointmentInput;

  if (!input.date || !input.startTime || !input.endTime) {
    return error(400, 'Missing required fields');
  }

  try {
    const appointmentId = uuidv4();

    await docClient.send(
      new PutCommand({
        TableName: process.env.TABLE_NAME,
        Item: {
          PK: `APPOINTMENT#${appointmentId}`,
          SK: `APPOINTMENT#${appointmentId}`,
          Type: 'Appointment',
          GSI1PK: `THERAPY#${therapyId}`,
          GSI1SK: `DATE#${input.date}T${input.startTime}`,
          appointmentId,
          therapyId,
          date: input.date,
          startTime: input.startTime,
          endTime: input.endTime,
          status: 'AVAILABLE',
          notes: input.notes,
          createdAt: new Date().toISOString(),
        }
      })
    )

    return success({
      message: 'Appointment created successfully',
      appointmentId
    });
  } catch (err) {
    console.error('Error creating appointment', err);
    return error(500, 'Internal Server Error');
  }
}
