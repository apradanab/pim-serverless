import { S3Client, PutObjectCommand, HeadObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

interface MediaConfig {
  bucketName: string;
  distributionDomainName: string;
  allowedTypes: Record<string, string>;
  maxSizeMB: number;
}

export class MediaService {
  private s3: S3Client;

  constructor(private config: MediaConfig) {
    this.s3 = new S3Client({ region: process.env.AWS_REGION });
  }

  async generateUploadUrl(
    type: 'therapy' | 'advice',
    id: string,
    contentType: string,
    contentLength?: number
  ) {
    if (!(contentType in this.config.allowedTypes)) {
      throw new Error(`Invalid content type. Allowed: ${Object.keys(this.config.allowedTypes).join(', ')}`);
    }

    if (contentLength && contentLength > this.config.maxSizeMB * 1024 * 1024) {
      throw new Error(`File exceeds maximum size (${this.config.maxSizeMB}MB)`);
    }

    const fileExt = this.config.allowedTypes[contentType];
    const key = `${type}/${id}/${Date.now()}.${fileExt}`;

    const uploadUrl = await getSignedUrl(
      this.s3,
      new PutObjectCommand({
        Bucket: this.config.bucketName,
        Key: key,
        ContentType: contentType,
      }),
      { expiresIn: 3600 }
    );

    return {
      uploadUrl,
      publicUrl: `https://${this.config.distributionDomainName}/${key}`,
      key,
    };
  }

  async getMediaMetadata(key: string) {
    const data = await this.s3.send(new HeadObjectCommand({
      Bucket: this.config.bucketName,
      Key: key,
    }));

    return {
      size: data.ContentLength,
      contentType: data.ContentType,
      lastModified: data.LastModified,
    };
  }

  async deleteMedia(key: string) {
    try {
      await this.s3.send(new DeleteObjectCommand({
        Bucket: this.config.bucketName,
        Key: key,
      }));
    } catch (error) {
      console.error(`Failed to delete media with key ${key}`, error);
      throw error;
    }
  }
}
