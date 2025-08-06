import { DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from '../handlers/shared/db-client';
import { ApiResponse, error, success } from '../handlers/shared/responses';

export const handler = async (event: {
  pathParameters?: { therapyId?: string };
}): Promise<ApiResponse> => {
  const therapyId = event.pathParameters?.therapyId;

  if (!therapyId) {
    return error(400, 'Missing therapy id in path')
  }

  try {
    await docClient.send(new DeleteCommand({
      TableName: process.env.TABLE_NAME,
      Key: {
        PK: `THERAPY#${therapyId}`,
        SK: `THERAPY#${therapyId}`
      },
    }));

    return success({ message: 'Therapy deleted successfully' });
  } catch (err) {
    console.error('Error deleting therapy:', err);
    return error(500, 'Internal Server Error')
  }
};
