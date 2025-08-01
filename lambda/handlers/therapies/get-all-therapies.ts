import { ScanCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from '../shared/db-client';
import { ApiResponse, error, success } from '../shared/responses';
import { Therapy } from '../shared/types/therapy';

export const handler = async (): Promise<ApiResponse> => {
  try {
    const result = await docClient.send(new ScanCommand({
        TableName: process.env.TABLE_NAME,
        FilterExpression: '#type = :therapy',
        ExpressionAttributeNames: { '#type': 'Type' },
        ExpressionAttributeValues: { ':therapy': 'Therapy' }
      })
    );

    return success(result.Items as Therapy[]);
  } catch (err) {
    console.error('Error fetching therapies:', err);
    return error(500, 'Internal Server Error');
  }
};
