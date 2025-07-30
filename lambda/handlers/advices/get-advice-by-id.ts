import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { docClient } from "../shared/db-client";
import { GetCommand } from "@aws-sdk/lib-dynamodb";

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  const therapyId = event.pathParameters?.therapyId;
  const adviceId = event.pathParameters?.adviceId;

  if (!therapyId || !adviceId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Missing therapy or advice ID in path' }),
    };
  }

  try {
    const result = await docClient.send(
      new GetCommand({
        TableName: process.env.TABLE_NAME,
        Key: {
          PK: `THERAPY#${therapyId}`,
          SK: `ADVICE#${adviceId}`,
        }
      })
    );

    if (!result.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Advice not found' }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(result.Item)
    }
  } catch (error) {
    console.error('Error Fething therapy by ID:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error' })
    };
  }
}
