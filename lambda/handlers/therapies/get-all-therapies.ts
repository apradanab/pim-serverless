import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { ScanCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from '../shared/db-client';

export const handler: APIGatewayProxyHandlerV2 = async () => {
  try {
    const { Items } = await docClient.send(
      new ScanCommand({
        TableName: process.env.TABLE_NAME,
        FilterExpression: '#type = :therapy',
        ExpressionAttributeNames: { '#type': 'Type' },
        ExpressionAttributeValues: {
          ':therapy': 'Therapy' 
        }
      })
    );

    return {
      statusCode: 200,
      body: JSON.stringify(Items || []),
    };
  } catch (error) {
    console.error('Error fetching therapies:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error fetching therapies' }),
    };
  }
};
