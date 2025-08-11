import { ApiResponse, error, success } from '../shared/dynamo';
import { DatabaseService } from '../../lib/constructs/services/database-service';

const dbService = new DatabaseService(process.env.TABLE_NAME!);

export const handler = async (event: {
  pathParameters?: { therapyId?: string; adviceId?: string };
}): Promise<ApiResponse> => {
  const { therapyId, adviceId } = event.pathParameters || {};

  if (!therapyId || !adviceId) {
    return error(400, 'Missing therapyId or adviceId in path');
  }

  try {
    await dbService.deleteItem(
      `THERAPY#${therapyId}`,
      `ADVICE#${adviceId}`
    )

    return success({ message: 'Advice deleted successfully' });
  } catch (err) {
    console.error('Error deleting advice:', err);
    return error(500, 'Internal Server Error');
  }
};
