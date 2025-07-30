import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import { docClient } from "../shared/db-client";

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  const { title, description, content, image, isGroup } = JSON.parse(event.body || '{}');

  try {
    if (!title || !description || !content) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Missing required fields' }),
      };
    }

    const therapyId = uuidv4();
    const createdAt = new Date().toISOString();

    await docClient.send(
      new PutCommand({
        TableName: process.env.TABLE_NAME,
        Item: {
          PK: `THERAPY#${therapyId}`,
          SK: `THERAPY#${therapyId}`,
          Type: 'Therapy',
          title,
          description,
          content,
          image,
          isGroup,
          therapyId,
          createdAt,
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
