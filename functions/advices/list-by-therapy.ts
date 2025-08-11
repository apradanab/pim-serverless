import { ApiResponse, error, success } from '../shared/dynamo';
import { Advice } from '../shared/types/advice';
import { DatabaseService } from '../../lib/constructs/services/database-service';

const dbService = new DatabaseService<Advice>(process.env.TABLE_NAME!);

export const handler = async (event: {
  pathParameters?: { therapyId?: string };
}): Promise<ApiResponse> => {
  const { therapyId } = event.pathParameters || {};

  if (!therapyId) {
    return error(400, 'Missing therapy id in path');
  }

  try {
    const advices = await dbService.queryItems(
      `THERAPY#${therapyId}`,
      'ADVICE#'
    );

    return success(advices);
  } catch (err) {
    console.error('Error fetching advices:', err);
    return error(500, 'Internal Server Error');
  }
};
