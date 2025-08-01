import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { docClient } from "../shared/db-client";
import { ApiResponse, error, success } from '../shared/responses';
import { CreateTherapyInput } from '../shared/types/therapy';

export const handler = async (event: { body?: string; }): Promise<ApiResponse> => {
  const input = JSON.parse(event.body || '{}') as CreateTherapyInput;

  if (!input.title || !input.description || !input.content) {
    return error(400, 'Missing required fields');
  }

  try {
    const therapyId = uuidv4();

    await docClient.send(
      new PutCommand({
        TableName: process.env.TABLE_NAME,
        Item: {
          PK: `THERAPY#${therapyId}`,
          SK: `THERAPY#${therapyId}`,
          Type: 'Therapy',
          therapyId,
          title: input.title,
          description: input.description,
          content: input.content,
          image: input.image,
          isGroup: input.isGroup,
          createdAt: new Date().toISOString(),
        }
      })
    );

    return success({ 
      message: 'Therapy created successfully', 
      therapyId 
    });
  } catch(err) {
    console.log('Error creting therapy', err);
    return error(500, 'Internal Server Error');
  }
};
