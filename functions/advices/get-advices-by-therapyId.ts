import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from '../handlers/shared/db-client';
import { ApiResponse, error, success } from "../handlers/shared/responses";
import { Advice } from '../handlers/shared/types/advice';

export const handler = async (event: {
  pathParameters?: { therapyId?: string };
}): Promise<ApiResponse> => {
  const { therapyId } = event.pathParameters || {};

  if (!therapyId) {
    return error(400, 'Missing therapyId in path');
  }

  try {
    const result = await docClient.send(
      new QueryCommand({
        TableName: process.env.TABLE_NAME,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': `THERAPY#${therapyId}`,
          ':sk': 'ADVICE#'
        }
      })
    );

    return success(result.Items as Advice[]);
  } catch (err) {
    console.error('Error fetching advices:', err);
    return error(500, 'Internal Server Error');
  }
};
