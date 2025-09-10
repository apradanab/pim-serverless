import { CognitoService } from "../../lib/constructs/services/cognito-service";
import { DatabaseService } from "../../lib/constructs/services/database-service";
import { EmailService } from "../../lib/constructs/services/email-service";
import { ApiResponse, error, success } from "../shared/dynamo";
import { User } from "../shared/types/user";
import { v4 as uuidv4 } from 'uuid';

const dbService = new DatabaseService<User>(process.env.TABLE_NAME!);
const emailService = new EmailService({
  region: process.env.REGION!,
  sourceEmail: process.env.SOURCE_EMAIL!
});
const cognitoService = new CognitoService({
  userPoolId: process.env.USER_POOL_ID!,
  clientId: process.env.USER_POOL_CLIENT_ID!,
  region: process.env.REGION!
});

export const handler = async (event: {
  pathParameters?: { userId: string };
  headers?: { Authorization?: string };
  requestContext?: {
    authorizer?: {
      claims?: {
        'cognito:groups'?: string;
        email?: string;
      }
    }
  }
}): Promise<ApiResponse> => {
  try {
    const authHeader = event.headers?.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return error(401, 'Authorization token required');
    }

    const groups = event.requestContext?.authorizer?.claims?.["cognito:groups"] || '';
    const userEmail = event.requestContext?.authorizer?.claims?.email;

    if (!groups || !groups.includes('ADMIN')) {
      return error(403, 'Admin access required')
    }

    // eslint-disable-next-line no-console
    console.log(`Admin user ${userEmail} approving user`);

    const userId = event.pathParameters?.userId;
    if(!userId) return error(400, 'User ID required');

    const user = await dbService.getItem(`USER#${userId}`, `USER#${userId}`);
    if(!user) return error(404, 'User not found');

    const registrationToken = uuidv4();
    const initialPassword = Math.random().toString(36).slice(-10) + 'A1!';

    await cognitoService.asignInitialPassword(user.email, initialPassword);

    const updateUser: Partial<User> = {
      approved: true,
      role: 'USER',
      registrationToken,
    };
    await dbService.updateItem(`USER#${userId}`, `USER#${userId}`, updateUser);

    await emailService.sendApprovalEmail(user.email, user.name, registrationToken);

    return success({ message: 'User approved successfully' });
  } catch (err) {
    console.error('Approve user error', err);
    return error(500, 'Error approving user');
  }
}
