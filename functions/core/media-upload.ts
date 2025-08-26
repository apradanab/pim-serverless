import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ApiResponse, error, success } from '../shared/dynamo';

const s3 = new S3Client({ region: process.env.AWS_REGION });

export const handler = async (event: {
  pathParameters?: {
    id: string,
    type: 'therapy' | 'advice'
  },
  queryStringParameters?: {
    contentType?: string
  }
}): Promise<ApiResponse> => {
  const { id, type } = event.pathParameters || {};
  const contentType = event.queryStringParameters?.contentType;
  const allowedTypes = ['image/jpg', 'image/jpeg', 'image/png', 'image/webp', 'image/svg',]

  if (!id || !type || !contentType) {
    return error(400, 'Missing required parameters');
  }

  if (!allowedTypes.includes(contentType)) {
    return error(400, 'Invalid content type')
  }

  const fileExt = contentType.split('/')[1];

  try {
    const key = `${type}/${id}/${Date.now()}.${fileExt}`;

    const uploadUrl = await getSignedUrl(s3, new PutObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: key,
      ContentType: contentType
    }), { expiresIn: 3600 });

    const viewUrl = `https://${process.env.CDN_DOMAIN}/${key}`;

    return success({
      uploadUrl,
      viewUrl,
      key
    });
  } catch (err: unknown) {
    console.error('Error generating signed URL:', err);
    return error(500, 'Failed to generate upload URL');
  }
};
