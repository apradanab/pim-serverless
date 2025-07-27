import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.TABLE_NAME;

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  const therapyId = event.pathParameters?.therapyId;

  if (!therapyId) {
    return { statusCode: 400, body: JSON.stringify({ message: 'Missing therapy ID' })};
  }
  if (!event.body) {
    return { statusCode: 400, body: JSON.stringify({ message: 'Missing request boody' })};
  }

  const { title, description, content, image, isGroup } = JSON.parse(event.body);

  if (!title && !description && !content && !image && isGroup === undefined) {
    return { statusCode: 400, body: JSON.stringify({ message: 'Nothing to update' }) };
  }

  try {
    const updateExpressionParts = [];
    const expressionAttributeValues: Record<string, unknown> = {};
    const expressionAttributeNames: Record<string, string> = {};

    if (title !== undefined) {
      updateExpressionParts.push('#title = :title');
      expressionAttributeValues[':title'] = title;
      expressionAttributeNames['#title'] = 'title';
    }
    if (description !== undefined) {
      updateExpressionParts.push('#description = :description');
      expressionAttributeValues[':description'] = description;
      expressionAttributeNames['#description'] = 'description';
    }
    if (content !== undefined) {
      updateExpressionParts.push('#content = :content');
      expressionAttributeValues[':content'] = content;
      expressionAttributeNames['#content'] = 'content';
    }
    if (image !== undefined) {
      updateExpressionParts.push('#image = :image');
      expressionAttributeValues[':image'] = image;
      expressionAttributeNames['#image'] = 'image';
    }
    if (isGroup !== undefined) {
      updateExpressionParts.push('#isGroup = :isGroup');
      expressionAttributeValues[':isGroup'] = isGroup;
      expressionAttributeNames['#isGroup'] = 'isGroup';
    }

    const updateExpression = 'SET ' + updateExpressionParts.join(', ');

    await docClient.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: `THERAPY#${therapyId}`, SK: `THERAPY#${therapyId}`},
      UpdateExpression: updateExpression,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Therapy updated' }),
    };
  } catch (error) {
    console.error('Error updating therapy', error);
    return { statusCode: 500, body: JSON.stringify({ message: 'Internal Server Error' })};
  }
}
