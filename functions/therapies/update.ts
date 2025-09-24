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
    const updateData: Partial<Therapy> = { ...input };

    if (input.imageKey) {
      const metadata = await mediaService.getMediaMetadata(input.imageKey);
      updateData.image = {
        key: input.imageKey,
        url: `https://${process.env.CDN_DOMAIN}/${input.imageKey}`,
        size: metadata.size,
        contentType: metadata.contentType
      }
    }

    if (therapy?.image?.key) {
      await mediaService.deleteMedia(therapy.image.key)
      .catch(error => console.error('Error deleting previous image:', error));
    }

    await dbService.updateItem(
      `THERAPY#${therapyId}`,
      `THERAPY#${therapyId}`,
      updateData
    )

    return success({ message: 'Therapy updated successfully' });
  } catch (err) {
    console.error('Error updating therapy:', err);

    if (input.imageKey) {
      await mediaService.deleteMedia(input.imageKey)
        .catch(e => console.error('Failed to cleanup image:', e));
    }
    return error(500, 'Internal Server Error');
  }
};
