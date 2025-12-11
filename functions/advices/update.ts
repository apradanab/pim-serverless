import { ApiResponse, error, success } from '../shared/dynamo';
import { Advice, UpdateAdviceInput } from '../shared/types/advice';
import { DatabaseService } from '../../lib/constructs/services/database-service';
import { MediaService } from '../../lib/constructs/services/media-service';

const dbService = new DatabaseService<Advice>(process.env.TABLE_NAME!)
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

export const handler = async (event: {
  pathParameters?: { therapyId?: string; adviceId?: string };
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
  const adviceId = event.pathParameters?.adviceId;

  if (!therapyId || !adviceId) return error(400, 'Therapy and advice ids are required');

  const input = JSON.parse(event.body || '{}') as UpdateAdviceInput;

  try {
    const advice = await dbService.getItem(
      `THERAPY#${therapyId}`,
      `ADVICE#${adviceId}`
    );

    if (!advice) {
      return error(404, "Advice not found");
    }

    const updateData: Partial<Advice> = { ...input };
    const newImageKey = input.image?.key;
    const currentDBImageKey = advice.image?.key;
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

      updateData.image = advice.image;
    }

    await dbService.updateItem(
      `THERAPY#${therapyId}`,
      `ADVICE#${adviceId}`,
      updateData
    );

    const updatedAdvice = await dbService.getItem(
      `THERAPY#${therapyId}`,
      `ADVICE#${adviceId}`
    );

    if (oldImageKey) {
      await mediaService.deleteMedia(oldImageKey).catch((err) => console.error("Error deleting previous image:", err));
    }

    return success(updatedAdvice);
  } catch (err) {
    console.error('Error updating advice:', err);

    const failedImageKey = input.image?.key;
    if (failedImageKey) {
      await mediaService.deleteMedia(failedImageKey)
        .catch(e => console.error('Failed to cleanup image:', e));
    }
    return error(500, 'Internal Server Error');
  }
}
