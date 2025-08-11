import { ApiResponse, error, success } from '../shared/dynamo';
import { Advice } from '../shared/types/advice';
import { DatabaseService } from '../../lib/constructs/services/database-service';

const dbService = new DatabaseService<Advice>(process.env.TABLE_NAME!);

export const handler = async (): Promise<ApiResponse> => {
  try {
    const advices = await dbService.queryByType('Advice');

    return success(advices)
  } catch (err) {
    console.error('Error fetching all advices:', err);
    return error(500, 'Internal Server Error');
  }
};
