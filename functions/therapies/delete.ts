import { DatabaseService } from '../../lib/constructs/services/database-service';
import { ApiResponse, error, success } from '../shared/dynamo';

const dbService = new DatabaseService(process.env.TABLE_NAME!);

export const handler = async (event: {
  pathParameters?: { therapyId?: string };
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

  const therapyId = event.pathParameters?.therapyId;

  if (!therapyId) {
    return error(400, 'Missing therapy id in path')
  }

  try {
    await dbService.deleteItem(`THERAPY#${therapyId}`, `THERAPY#${therapyId}`);
    return success({ message: 'Therapy deleted successfully' });
  } catch (err) {
    console.error('Error deleting therapy:', err);
    return error(500, 'Internal Server Error')
  }
};
