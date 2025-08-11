import { DatabaseService } from '../../lib/constructs/services/database-service';
import { Therapy } from '../shared/types/therapy';
import { ApiResponse, error, success } from '../shared/dynamo';

const dbService = new DatabaseService<Therapy>(process.env.TABLE_NAME!);

export const handler = async (event: {
  pathParameters?: { therapyId?: string };
}): Promise<ApiResponse> => {
  const therapyId = event.pathParameters?.therapyId;

  if (!therapyId) {
    return error(400, 'Missing therapy id in path');
  }

  try {
    const therapy = await dbService.getItem(
      `THERAPY#${therapyId}`,
      `THERAPY#${therapyId}`
    );

    if (!therapy) return error(404, 'Therapy Not Found');

    return success(therapy)
  } catch (err) {
    console.error('Error Fething therapy:', err);
    return error(500, 'Internal Server Error');
  }
};
