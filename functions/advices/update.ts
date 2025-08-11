import { ApiResponse, error, success } from '../shared/dynamo';
import { Advice, UpdateAdviceInput } from '../shared/types/advice';
import { DatabaseService } from '../../lib/constructs/services/database-service';

const dbService = new DatabaseService<Advice>(process.env.TABLE_NAME!)

export const handler = async (event: {
  pathParameters?: { therapyId?: string; adviceId?: string };
  body?: string;
}): Promise<ApiResponse> => {
  const therapyId = event.pathParameters?.therapyId;
  const adviceId = event.pathParameters?.adviceId;

  if (!therapyId || !adviceId) return error(400, 'Therapy and advice ids are required');

  const input = JSON.parse(event.body || '{}') as UpdateAdviceInput;

  try {
    await dbService.updateItem(
      `THERAPY#${therapyId}`,
      `ADVICE#${adviceId}`,
      input
    );

    return success({ message: 'Advice updated successfully' });
  } catch (err) {
    console.error('Error updating advice:', err);
    return error(500, 'Internal Server Error');
  }
}
