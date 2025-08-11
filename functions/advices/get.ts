import { ApiResponse, error, success } from '../shared/dynamo';
import { Advice } from "../shared/types/advice";
import { DatabaseService } from "../../lib/constructs/services/database-service";

const dbService = new DatabaseService<Advice>(process.env.TABLE_NAME!);

export const handler = async (event: {
  pathParameters?: { therapyId?: string; adviceId?: string };
}): Promise<ApiResponse> => {
  const { therapyId, adviceId } = event.pathParameters || {};

  if (!therapyId || !adviceId) {
    return error(400, 'Missing therapyId or adviceId in path');
  }

  try {
    const advice = await dbService.getItem(
      `THERAPY#${therapyId}`,
      `ADVICE#${adviceId}`
    );

    if (!advice) return error(404, 'Advice not found');

    return success(advice);
  } catch (err) {
    console.error('Error fetching advice:', err);
    return error(500, 'Internal Server Error');
  }
}
