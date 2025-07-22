import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.TABLE_NAME!;

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    if(!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Missing request body' }),
      };
    }

    const { title, description, content, image, isGroup } = JSON.parse(event.body);

    if (!title || !description || !content) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Missing required fields' }),
      };
    }

    const therapyId = uuidv4();
    const timeStamp = new Date().toISOString();

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: `THERAPY#${therapyId}`,
          SK: `THERAPY#${therapyId}`,
          Type: 'Therapy',
          title,
          description,
          content,
          image,
          isGroup,
          createdAt: timeStamp,
        }
      })
    );

    return {
      statusCode: 201,
      body: JSON.stringify({ message: 'Therapy created', therapyId }),
    };
  } catch(error) {
    console.log('Error creting therapy', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Inernal Server Error '}),
    };
  }
};
