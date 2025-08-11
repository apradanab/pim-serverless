import { v4 as uuidv4 } from 'uuid';
import { CreateTherapyInput, Therapy } from '../shared/types/therapy';
import { MediaService } from '../../lib/constructs/services/media-service';
import { DatabaseService } from '../../lib/constructs/services/database-service';
import { ApiResponse, error, success } from '../shared/dynamo';

const dbService = new DatabaseService<Therapy>(process.env.TABLE_NAME!);
const mediaService = new MediaService({
  bucketName: process.env.MEDIA_BUCKET!,
  distributionDomainName: process.env.CDN_DOMAIN!,
  allowedTypes: {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp'
  },
  maxSizeMB: 5
});

export const handler = async (event: { body?: string }): Promise<ApiResponse> => {
  const input = JSON.parse(event.body || '{}') as CreateTherapyInput;

  if (!input.title || !input.description || !input.content) {
    return error(400, 'Missing required fields');
  }

  try {
    const therapyId = uuidv4();
    const therapyData: Therapy = {
      PK: `THERAPY#${therapyId}`,
      SK: `THERAPY#${therapyId}`,
      Type: 'Therapy',
      therapyId,
      title: input.title,
      description: input.description,
      content: input.content,
      isGroup: input.isGroup || false,
      createdAt: new Date().toISOString()
    };

    if (input.imageKey) {
      const metadata = await mediaService.getMediaMetadata(input.imageKey);
      therapyData.image = {
        key: input.imageKey,
        url: `https://${process.env.CDN_DOMAIN}/${input.imageKey}`,
        size: metadata.size,
        contentType: metadata.contentType
      };
    }

    await dbService.createItem(therapyData);

    return success({
      message: 'Therapy created successfully',
      therapyId
    });
  } catch (err) {
    console.error('Error creating therapy', err);
    if (input.imageKey) {
      await mediaService
        .deleteMedia(input.imageKey)
        .catch(e => console.error('Failed to cleanup image:', e));
    }
    return error(500, 'Internal Server Error');
  }
};
