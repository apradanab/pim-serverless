import { DatabaseService } from "../../lib/constructs/services/database-service";
import { ApiResponse, error, success } from "../shared/dynamo";
import { Appointment } from "../shared/types/appointment";
import { User } from "../shared/types/user";

interface CognitoClaims {
  sub: string;
  'cognito:groups'?: string[];
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
    const claims = event.requestContext?.authorizer?.claims;
    if(!claims) return error(403, 'Unauthorized');

    const isAdmin = claims['cognito:groups']?.includes('ADMIN');
    let targetUserId = claims.sub;

    if (isAdmin && event.pathParameters?.userId) {
      const targetUser = await dbService.getItem(
        `USER#${event.pathParameters.userId}`,
        `USER#${event.pathParameters.userId}`
      ) as unknown as User;

      if (!targetUser?.cognitoId) return error(404, 'User not found');
      targetUserId = targetUser.cognitoId;
    }

    const appointments = await dbService.queryByUserId(targetUserId);
    return success(appointments);

  } catch (err) {
    console.error('Error fetching appointments', err);
    return error(500, 'Internal Server Error');
  }
};
