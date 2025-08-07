import { Bucket } from 'aws-cdk-lib/aws-s3';
import { Distribution } from 'aws-cdk-lib/aws-cloudfront';
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

interface MediaConfig {
  bucket: Bucket;
  distribution: Distribution;
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
        Bucket: this.config.bucket.bucketName,
        Key: key,
        ContentType: contentType,
      }),
      { expiresIn: 3600 }
    );

    return {
      uploadUrl,
      publicUrl: `https://${this.config.distribution.distributionDomainName}/${key}`,
      key,
    };
  }

  async getMediaMetadata(key: string) {
    const data = await this.s3.send(new HeadObjectCommand({
      Bucket: this.config.bucket.bucketName,
      Key: key,
    }));

    return {
      size: data.ContentLength,
      contentType: data.ContentType,
      lastModified: data.LastModified,
    };
  }
}
