import { DatabaseService } from "../../lib/constructs/services/database-service";
import { ApiResponse, error, success } from "../shared/dynamo";
import { Appointment } from "../shared/types/appointment";

interface CognitoClaims {
  sub: string;
  email?: string;
  'cognito:groups'?: string[];
  [key: string]: unknown;
}

const dbService = new DatabaseService<Appointment>(process.env.TABLE_NAME!);

export const handler = async (event: {
  pathParameters?: { userId?: string };
  requestContext?: {
    authorizer?: {
      claims?: CognitoClaims
    }
  };
}): Promise<ApiResponse> => {
  try {
    const userId = event.pathParameters?.userId;
    const claims = event.requestContext?.authorizer?.claims;

    if(!userId) return error(400, 'User ID is required');
    if(!claims) return error(403, 'Unauthorized: missing claims');

    if (claims.sub !== userId && !claims['cognito:groups']?.includes('ADMIN')) {
      return error(403, 'Forbidden: not allowed to access this resource')
    }

    const appointments = await dbService.queryByUserId(userId);

    return success(appointments);
  } catch (err) {
    console.error(`Error fetching user appointments`, err);
    return error(500, 'Internal Server Error');
  }
};
