import { InvalidParameterException, InvalidPasswordException } from "@aws-sdk/client-cognito-identity-provider";
import { CognitoService } from "../../lib/constructs/services/cognito-service";
import { DatabaseService } from "../../lib/constructs/services/database-service";
import { MediaService } from "../../lib/constructs/services/media-service";
import { ApiResponse, error, success } from "../shared/dynamo";
import { UpdateUserInput, User } from "../shared/types/user";

const dbService = new DatabaseService<User>(process.env.TABLE_NAME!);
const cognitoService = new CognitoService({
  userPoolId: process.env.USER_POOL_ID!,
  clientId: process.env.USER_POOL_CLIENT_ID!,
  region: process.env.REGION!
});
const mediaService = new MediaService({
  bucketName: process.env.BUCKET_NAME!,
  distributionDomainName: process.env.CDN_DOMAIN!,
  allowedTypes: {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp'
  },
  maxSizeMB: 5
});

interface CognitoClaims {
  sub: string;
  email?: string;
  ['cognito:groups']?: string[];
  [key: string]: unknown;
}

export const handler = async (event: {
  pathParameters?: { userId?: string };
  body?: string;
  requestContext?: {
    authorizer?: {
      claims?: CognitoClaims
    }
  }
}): Promise<ApiResponse> => {
  try {
    const claims = event.requestContext?.authorizer?.claims;
    if (!claims?.email) return error(401, 'Authentication required');

    const bodyToParse = event.body?.trim() || '';
    const input = JSON.parse(bodyToParse === '' ? '{}' : bodyToParse) as UpdateUserInput;

    const users = await dbService.queryByEmail(claims.email);
    const user = users[0];
    if (!user) return error(404, 'User not found');

    const updateData: Partial<User> = {};

    if (input.email && input.email !== user.email) {
      try {
        await cognitoService.updateUserAttribute(user.email, 'email', input.email);
        updateData.email = input.email;
      } catch (cognitoError) {
        console.error('Cognito attribute update failed for email:', cognitoError);
        return error(400, 'Error updating email in authentication service.');
      }
    }

    if (input.password) {
      try {
        await cognitoService.setUserPassword(user.email, input.password);
      } catch (cognitoError) {
        console.error('Cognito password update failed:', cognitoError);

        if (cognitoError instanceof InvalidPasswordException || cognitoError instanceof InvalidParameterException) {
          return error(400, 'Error updating password. The new password does not meet the complexity requirements')
        }
        return error(500, 'Failed to update password in authentication service.')
      }

    }

    if (input.name) {
      updateData.name = input.name;
    }

    if (input.avatarKey) {
      const metadata = await mediaService.getMediaMetadata(input.avatarKey);

      updateData.avatar = {
        key: input.avatarKey,
        url: `https://${process.env.CDN_DOMAIN}/${input.avatarKey}`,
        size: metadata.size,
        contentType: metadata.contentType
      };

      if (user.avatar?.key && user.avatar.key !== input.avatarKey) {
        await mediaService.deleteMedia(user.avatar.key)
          .catch(err => console.error('Error deleting old avatar:', err));
      }
    }

    if (Object.keys(updateData).length > 0) {
      await dbService.updateItem(`USER#${user.userId}`, `USER#${user.userId}`, updateData);

      const updatedUser = await dbService.getItem(`USER#${user.userId}`, `USER#${user.userId}`);

      if (!updatedUser) return error(500, 'Updated user not found after write');
      return success(updatedUser);
    } else {

      return success(user);
    }

  } catch (err) {
    console.error('Error updating user profile', err);

    const bodyToParse = event.body?.trim() || '';
    const input = JSON.parse(bodyToParse === '' ? '{}' : bodyToParse) as UpdateUserInput;
    if (input.avatarKey) {
      await mediaService.deleteMedia(input.avatarKey)
        .catch(e => console.error('Failed to cleanup avatar:', e));
    }

    return error(500, 'Internal Server Error');
  }
};
