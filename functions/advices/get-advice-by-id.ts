import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "../handlers/shared/db-client";
import { ApiResponse, error, success } from "../handlers/shared/responses";
import { Advice } from "../handlers/shared/types/advice";

export const handler = async (event: {
  pathParameters?: { therapyId?: string; adviceId?: string };
}): Promise<ApiResponse> => {
  const { therapyId, adviceId } = event.pathParameters || {};

  if (!therapyId || !adviceId) {
    return error(400, 'Missing therapyId or adviceId in path');
  }

  try {
    const result = await docClient.send(new GetCommand({
      TableName: process.env.TABLE_NAME,
      Key: {
        PK: `THERAPY#${therapyId}`,
        SK: `ADVICE#${adviceId}`,
      },
    }));

    if (!result.Item) {
      return error(404, 'Advice not found');
    }

    return success(result.Item as Advice);
  } catch (err) {
    console.error('Error fetching advice:', err);
    return error(500, 'Internal Server Error');
  }
}
