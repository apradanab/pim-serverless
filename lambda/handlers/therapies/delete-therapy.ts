import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from '../shared/db-client';

const TABLE_NAME = process.env.TABLE_NAME!;

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  const therapyId = event.pathParameters?.therapyId;
  if (!therapyId) {
    return { statusCode: 400, body: JSON.stringify({ message: 'Missing therapy ID' })};
  }
  try {
    await docClient.send(new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { PK: `THERAPY#${therapyId}`, SK: `THERAPY#${therapyId}`}
    }));
    return { statusCode: 200, body: JSON.stringify({ message: 'Therapy deleted' })};
  } catch (error) {
    console.error(error);
    return { statusCode: 500, boody: JSON.stringify({ message: 'Internal Server Error' })};
  }
};
