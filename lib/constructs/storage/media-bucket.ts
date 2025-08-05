import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import { Duration } from 'aws-cdk-lib';

export class MediaBucket extends Construct {
  public readonly bucket: s3.Bucket;
  public readonly distribution: cloudfront.Distribution;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.bucket = new s3.Bucket(this, 'MediaBucket', {
      cors: [{
        allowedMethods: [s3.HttpMethods.PUT, s3.HttpMethods.GET],
        allowedOrigins: ['*'],
        allowedHeaders: ['*']
      }],
      lifecycleRules: [{
        abortIncompleteMultipartUploadAfter: Duration.days(1),
        expiration: Duration.days(365)
      }]
    });

    const originAccessControl = new cloudfront.S3OriginAccessControl(this, 'MediaBucketOAC', {
      originAccessControlName: 'PIM-OAC',
      signing: cloudfront.Signing.SIGV4_ALWAYS
    });

    this.distribution = new cloudfront.Distribution(this, 'MediaCDN', {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(this.bucket, {
          originAccessControl: originAccessControl
        }),
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS
      }
    })
  }
}
