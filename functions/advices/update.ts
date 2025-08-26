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
}): Promise<ApiResponse> => {
  const therapyId = event.pathParameters?.therapyId;
  const adviceId = event.pathParameters?.adviceId;

  if (!therapyId || !adviceId) return error(400, 'Therapy and advice ids are required');

  const input = JSON.parse(event.body || '{}') as UpdateAdviceInput;

  try {
    const advice = await dbService.getItem(
      `THERAPY#${therapyId}`,
      `ADVICE#${adviceId}`
    );
    const updateData: Partial<Advice> = { ...input };

    if (input.imageKey) {
      const metadata = await mediaService.getMediaMetadata(input.imageKey);
      updateData.image = {
        key: input.imageKey,
        url: `https://${process.env.CDN_DOMAIN}/${input.imageKey}`,
        size: metadata.size,
        contentType: metadata.contentType
      }
    }

    if (advice?.image?.key) {
      await mediaService.deleteMedia(advice.image.key)
        .catch(error => console.error('Error deleting previous image', error));
    }

    await dbService.updateItem(
      `THERAPY#${therapyId}`,
      `ADVICE#${adviceId}`,
      updateData
    );

    return success({ message: 'Advice updated successfully' });
  } catch (err) {
    console.error('Error updating advice:', err);

    if (input.imageKey) {
      await mediaService.deleteMedia(input.imageKey)
        .catch(e => console.error('Failed to cleanup image:', e));
    }
    return error(500, 'Internal Server Error');
  }
}
