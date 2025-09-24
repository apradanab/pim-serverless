import { ApiResponse, error, success } from '../shared/dynamo';
import { DatabaseService } from '../../lib/constructs/services/database-service';

const dbService = new DatabaseService(process.env.TABLE_NAME!);

export const handler = async (event: {
  pathParameters?: { therapyId?: string; adviceId?: string };
  requestContext?: {
    authorizer?: {
      claims?: {
        email?: string;
        sub?: string;
        ['cognito:groups']?: string;
      }
    }
  }
}): Promise<ApiResponse> => {
  const groups = event.requestContext?.authorizer?.claims?.['cognito:groups'] || '';

  if (!groups.includes('ADMIN')) {
    return error(403, 'Only Admins are authorized to create therapies');
  }

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
