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

export const handler = async (event: { body?: string }): Promise<ApiResponse> => {
  try {
    const input = JSON.parse(event.body || '{}') as UpdateUserInput;

    if (!input.registrationToken || !input.password || !input.email) {
      return error(400, 'Token, password, and email are required')
    }

    const { registrationToken, password, email } = input;
    const users = await dbService.queryByEmail(email);
    const user = users.find(u => u.registrationToken === registrationToken);

    if(!user) return error(404, 'Invalid token');

    await cognitoService.setUserPassword(user.email, password);

    const updateData: Partial<User> = {
      name: input.name,
      role: 'USER',
      approved: true,
    };

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

    await dbService.updateItem(`USER#${user.userId}`, `USER#${user.userId}`, updateData);

    return success({ message: 'Registration completed successfully' });

  } catch (err) {
    console.error("Update user error", err);

    const input = JSON.parse(event.body || '{}' ) as UpdateUserInput;
    if (input.avatarKey) {
      await mediaService.deleteMedia(input.avatarKey)
        .catch(e => console.error('Failed to cleanup avatar:', e));
    }

    return error(500, "Error completing registration");
  }
}
