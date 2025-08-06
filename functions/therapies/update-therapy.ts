import { UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from '../handlers/shared/db-client';
import { ApiResponse, success, error } from '../handlers/shared/responses';
import { UpdateTherapyInput } from '../handlers/shared/types/therapy';

export const handler = async (event: {
  pathParameters?: { therapyId?: string };
  body?: string;
}): Promise<ApiResponse> => {
  const therapyId = event.pathParameters?.therapyId;
  if (!therapyId) return error(400, 'Therapy id is required');

  const input = JSON.parse(event.body || '{}') as UpdateTherapyInput;
  const fieldsToUpdate = Object.keys(input);

  try {
    const updateExpression = `SET ${fieldsToUpdate.map(field => `#${field} = :${field}`).join(', ')}`;

    const expressionAttributeNames = fieldsToUpdate.reduce(
      (acc, field) => ({ ...acc, [`#${field}`]: field }),
      {}
    );

    const expressionAttributeValues = fieldsToUpdate.reduce(
      (acc, field) => ({ ...acc, [`:${field}`]: input[field as keyof UpdateTherapyInput] }),
      {}
    );

    await docClient.send(new UpdateCommand({
      TableName: process.env.TABLE_NAME,
      Key: { PK: `THERAPY#${therapyId}`, SK: `THERAPY#${therapyId}` },
      UpdateExpression: updateExpression,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
    }));

    return success({ message: 'Therapy updated successfully' });
  } catch (err) {
    console.error('Error updating therapy:', err);
    return error(500, 'Internal Server Error');
  }
};
