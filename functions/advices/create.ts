import { Advice, CreateAdviceInput } from '../shared/types/advice';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from '../../lib/constructs/services/database-service';
import { MediaService } from '../../lib/constructs/services/media-service';
import { ApiResponse, error, success } from '../shared/dynamo';

const dbService = new DatabaseService<Advice>(process.env.TABLE_NAME!);
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
  const input = JSON.parse(event.body || '{}') as CreateAdviceInput;

  if (!therapyId || !input.title || !input.description || !input.content) {
    return error(400, 'Missing required fields');
  }

  try {
    const adviceId = uuidv4();
    const newAdvice: Advice = {
      PK: `THERAPY#${therapyId}`,
      SK: `ADVICE#${adviceId}`,
      Type: 'Advice',
      therapyId,
      adviceId,
      title: input.title,
      description: input.description,
      content: input.content,
      createdAt: new Date().toISOString(),
    };

    if (input.imageKey) {
      const metadata = await mediaService.getMediaMetadata(input.imageKey);
      newAdvice.image = {
        key: input.imageKey,
        url: `https://${process.env.CDN_DOMAIN}/${input.imageKey}`,
        size: metadata.size,
        contentType: metadata.contentType
      };
    }

    await dbService.createItem(newAdvice);

    return success({
      message: 'Advice created successfully',
      data: {
        adviceId,
        therapyId,
      },
    });
  } catch (err) {
    console.error('Error creating advice:', err);
    if (input.imageKey) {
      await mediaService
        .deleteMedia(input.imageKey)
        .catch(e => console.error('Failed to cleanup image:', e));
    }
    return error(500, 'Internal Server Error');
  }
};
