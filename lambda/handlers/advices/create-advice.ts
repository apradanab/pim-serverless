import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { docClient } from "../shared/db-client";

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  const { therapyId } = event.pathParameters || {};
  const { title, description, content, image } = JSON.parse(event.body || '{}');

  if (!therapyId || !title || !description || !content) {
    return { statusCode: 400, body: JSON.stringify({ message: 'Missing required fields' })};
  }

  try {
    const adviceId = uuidv4();
    const createdAt = new Date().toISOString();

    await docClient.send(
      new PutCommand({
        TableName: process.env.TABLE_NAME,
        Item: {
          PK: `THERAPY#${therapyId}`,
          SK: `ADVICE#${adviceId}`,
          Type: 'Advice',
          title,
          description,
          content,
          image,
          therapyId,
          adviceId,
          createdAt,
        }
      })
    );

    return {
      statusCode: 201,
      body: JSON.stringify({ message: 'Advice created', adviceId, therapyId })
    }
  } catch (error) {
    console.error('Error creating advice', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error' })
    };
  }
};
