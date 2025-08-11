import { DatabaseService } from '../../lib/constructs/services/database-service';
import { UpdateTherapyInput } from '../shared/types/therapy';
import { ApiResponse, error, success } from '../shared/dynamo';
import { Therapy } from '../shared/types/therapy';

const dbService = new DatabaseService<Therapy>(process.env.TABLE_NAME!)

export const handler = async (event: {
  pathParameters?: { therapyId?: string };
  body?: string;
}): Promise<ApiResponse> => {
  const therapyId = event.pathParameters?.therapyId;
  if (!therapyId) return error(400, 'Therapy id is required');

  const input = JSON.parse(event.body || '{}') as UpdateTherapyInput;

  try {
    await dbService.updateItem(
      `THERAPY#${therapyId}`,
      `THERAPY#${therapyId}`,
      input
    )

    return success({ message: 'Therapy updated successfully' });
  } catch (err) {
    console.error('Error updating therapy:', err);
    return error(500, 'Internal Server Error');
  }
};
