import { DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from '../shared/db-client';
import { ApiResponse, error, success } from '../shared/responses';

export const handler = async (event: {
  pathParameters?: { therapyId?: string; adviceId?: string };
}): Promise<ApiResponse> => {
  const { therapyId, adviceId } = event.pathParameters || {};

  if (!therapyId || !adviceId) {
    return error(400, 'Missing therapyId or adviceId in path');
  }

  try {
    await docClient.send(new DeleteCommand({
      TableName: process.env.TABLE_NAME,
      Key: {
        PK: `THERAPY#${therapyId}`,
        SK: `ADVICE#${adviceId}`,
      },
    }));

    return success({ message: 'Advice deleted successfully' });
  } catch (err) {
    console.error('Error deleting advice:', err);
    return error(500, 'Internal Server Error');
  }
};
