import { UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from '../shared/db-client';
import { ApiResponse, success, error } from '../shared/responses';
import { UpdateAdviceInput } from '../shared/types/advice';

export const handler = async (event: {
  pathParameters?: { therapyId?: string; adviceId?: string };
  body?: string;
}): Promise<ApiResponse> => {
  const therapyId = event.pathParameters?.therapyId;
  const adviceId = event.pathParameters?.adviceId;

  if (!therapyId || !adviceId) return error(400, 'Therapy and advice ids are required');

  const input = JSON.parse(event.body || '{}') as UpdateAdviceInput;
  const fieldsToUpdate = Object.keys(input);

  try {
    const updateExpression = `SET ${fieldsToUpdate.map(field => `#${field} = :${field}`).join(', ')}`;
    
    const expressionAttributeNames = fieldsToUpdate.reduce(
      (acc, field) => ({ ...acc, [`#${field}`]: field }),
      {}
    );

    const expressionAttributeValues = fieldsToUpdate.reduce(
      (acc, field) => ({ ...acc, [`:${field}`]: input[field as keyof UpdateAdviceInput] }),
      {}
    );

    await docClient.send(new UpdateCommand({
      TableName: process.env.TABLE_NAME,
      Key: { PK: `THERAPY#${therapyId}`, SK: `ADVICE#${adviceId}`},
      UpdateExpression: updateExpression,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
    }));

    return success({ message: 'Advice updated successfully' });
  } catch (err) {
    console.error('Error updating advice:', err);
    return error(500, 'Internal Server Error');
  }
}
