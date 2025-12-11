import { DatabaseService } from '../../lib/constructs/services/database-service';
import { ApiResponse, error, success } from '../shared/dynamo';
import { UpdateTherapyInput, Therapy } from '../shared/types/therapy';
import { MediaService } from '../../lib/constructs/services/media-service';

const dbService = new DatabaseService<Therapy>(process.env.TABLE_NAME!);
const mediaService = new MediaService({
  bucketName: process.env.BUCKET_NAME!,
  distributionDomainName: process.env.CDN_DOMAIN!,
  allowedTypes: {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp'
  },
  maxSizeMB: 5
})

export const handler = async (event: {
  pathParameters?: { therapyId?: string };
  body?: string;
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
  if (!therapyId) return error(400, 'Therapy id is required');

  const input = JSON.parse(event.body || '{}') as UpdateTherapyInput;

  try {
    const therapy = await dbService.getItem(
      `THERAPY#${therapyId}`,
      `THERAPY#${therapyId}`
    );

    if (!therapy) {
      return error(404, "Therapy not found");
    }

    const updateData: Partial<Therapy> = { ...input };
    const newImageKey = input.image?.key;
    const currentDBImageKey = therapy.image?.key;
    let oldImageKey: string | undefined;

    if (newImageKey && newImageKey !== currentDBImageKey) {
      oldImageKey = currentDBImageKey;
      const metadata = await mediaService.getMediaMetadata(newImageKey);

      updateData.image = {
        key: newImageKey,
        url: `https://${process.env.CDN_DOMAIN}/${newImageKey}`,
        size: metadata.size,
        contentType: metadata.contentType
      }
    } else if (input.image === null) {
      delete updateData.image;
      oldImageKey = currentDBImageKey;

    } else if (currentDBImageKey && newImageKey === currentDBImageKey) {
      updateData.image = therapy.image;

    }

    await dbService.updateItem(
      `THERAPY#${therapyId}`,
      `THERAPY#${therapyId}`,
      updateData
    )

    const updatedTherapy = await dbService.getItem(
      `THERAPY#${therapyId}`,
      `THERAPY#${therapyId}`
    )

    if (oldImageKey) {
      await mediaService.deleteMedia(oldImageKey).catch(error => console.error('Error deleting previous image:', error));
    }

    return success(updatedTherapy);
  } catch (err) {
    console.error('Error updating therapy:', err);

    const failedImageKey = input.image?.key;
    if (failedImageKey) {
      await mediaService.deleteMedia(failedImageKey)
        .catch(e => console.error('Failed to cleanup image:', e));
    }
    return error(500, 'Internal Server Error');
  }
};
