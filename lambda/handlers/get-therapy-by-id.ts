import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyHandlerV2 } from 'aws-lambda';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.TABLE_NAME;

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const therapyId = event.pathParameters?.therapyId;

    if (!therapyId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Missing therapy ID in path' }),
      };
    }

    const result = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `THERAPY#${therapyId}`,
          SK: `THERAPY#${therapyId}`,
        },
      })
    );

    if (!result.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Therapy not found' }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(result.Item),
    };

  } catch (error) {
    console.error('Error Fething therapy by ID:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error' })
    };
  }
};
