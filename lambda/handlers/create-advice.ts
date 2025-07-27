import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { docClient } from "./shared/db-client";

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    if (!event.body) {
      return { statusCode: 400, body: JSON.stringify({ message: 'Missing request body' })};
    }

    const { therapyId } = event.pathParameters || {};
    const { title, description, content, image } = JSON.parse(event.body);

    if (!therapyId || !title || !description || !content) {
      console.log('Missing fields:', { 
        missingTherapyId: !therapyId,
        missingTitle: !title,
        missingDescription: !description,
        missingContent: !content
      });
      return { statusCode: 400, body: JSON.stringify({ message: 'Missing required fields' })};
    }

    const adviceId = uuidv4();
    const timeStamp = new Date().toISOString();

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
          createdAt: timeStamp,
        }
      })
    );

    return {
      statusCode: 201,
      body: JSON.stringify({ message: 'Advice created', adviceId })
    }
  } catch (error) {
    console.error('Error creating advice', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error' })
    };
  }
};
