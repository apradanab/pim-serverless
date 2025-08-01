import { ScanCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from '../shared/db-client';
import { ApiResponse, success, error } from "../shared/responses";
import { Advice } from '../shared/types/advice';

export const handler = async (): Promise<ApiResponse> => {
  try {
    const result = await docClient.send(new ScanCommand({
        TableName: process.env.TABLE_NAME,
        FilterExpression: '#type = :advice',
        ExpressionAttributeNames: { '#type': 'Type' },
        ExpressionAttributeValues: {
          ':advice': 'Advice'
        }
      })
    );

    return success(result.Items as Advice[])
  } catch (err) {
    console.error('Error fetching all advices:', err);
    return error(500, 'Internal Server Error');
  }
};
