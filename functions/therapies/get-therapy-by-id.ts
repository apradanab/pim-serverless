import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from '../handlers/shared/db-client';
import { ApiResponse, error, success } from '../handlers/shared/responses';
import { Therapy } from '../handlers/shared/types/therapy';

export const handler = async (event: {
  pathParameters?: { therapyId?: string };
}): Promise<ApiResponse> => {
  const therapyId = event.pathParameters?.therapyId;

  if (!therapyId) {
    return error(400, 'Missing therapy id in path');
  }

  try {
    const result = await docClient.send(new GetCommand({
        TableName: process.env.TABLE_NAME,
        Key: {
          PK: `THERAPY#${therapyId}`,
          SK: `THERAPY#${therapyId}`,
        },
      })
    );

    if (!result.Item) {
      return error(404, 'Therapy Not Found');
    }

    return success(result.Item as Therapy)
  } catch (err) {
    console.error('Error Fething therapy:', err);
    return error(500, 'Internal Server Error');
  }
};
