import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from '../shared/db-client';

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  const { therapyId } = event.pathParameters || {};

  if (!therapyId) {
    return { 
      statusCode: 400, 
      body: JSON.stringify({ message: 'Missing therapyId in path' }) 
    };
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

    return {
      statusCode: 200,
      body: JSON.stringify(result.Items || [])
    };
  } catch (error) {
    console.error('Error fetching advices:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error' })
    };
  }
};
