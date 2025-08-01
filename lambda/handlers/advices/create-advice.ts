import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from '../shared/db-client';
import { ApiResponse, error, success } from "../shared/responses";
import { Advice, CreateAdviceInput } from '../shared/types/advice';
import { v4 as uuidv4 } from 'uuid';

export const handler = async (event: { 
  pathParameters?: { therapyId?: string };
  body?: string;
}): Promise<ApiResponse> => {
  const therapyId = event.pathParameters?.therapyId;
  const input = JSON.parse(event.body || '{}') as CreateAdviceInput;

  if (!therapyId || !input.title || !input.description || !input.content) {
    return error(400, 'Missing required fields');
  }

  try {
    const adviceId = uuidv4();
    const newAdvice: Advice = {
      PK: `THERAPY#${therapyId}`,
      SK: `ADVICE#${adviceId}`,
      Type: 'Advice',
      therapyId,
      adviceId,
      title: input.title,
      description: input.description,
      content: input.content,
      image: input.image,
      createdAt: new Date().toISOString(),
    };

    await docClient.send(new PutCommand({
      TableName: process.env.TABLE_NAME,
      Item: newAdvice,
    }));

    return success({ 
      message: 'Advice created successfully',
      data: {
        adviceId,
        therapyId,
      },
    });
  } catch (error) {
    console.error('Error creating advice:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error' })
    }
  }
};
