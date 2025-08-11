import { DatabaseService } from '../../lib/constructs/services/database-service';
import { ApiResponse, error, success } from '../shared/dynamo';
import { Therapy } from '../shared/types/therapy';

const dbService = new DatabaseService<Therapy>(process.env.TABLE_NAME!);

export const handler = async (): Promise<ApiResponse> => {
  try {
    const therapies = await dbService.queryByType('Therapy');

    return success(therapies);
  } catch (err) {
    console.error('Error fetching therapies:', err);
    return error(500, 'Internal Server Error');
  }
};
