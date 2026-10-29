import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { env } from "../../../config/env";
import { childLogger } from "../../../infra/observability/logger";
import { FilesStore } from "../application/files.service";

/**
 * S3-compatible adapter (PHASE-002 §2.7): AWS SDK v3 client against the
 * configured endpoint — MinIO in the dev compose stack, s3rver in the test
 * suite, real S3-compatible storage in production. Path-style addressing is
 * forced so local stacks resolve buckets correctly.
 */
const log = childLogger({ module: "files" });

export class S3FilesStore extends FilesStore {
  private client(): S3Client {
    return new S3Client({
      region: env.S3_REGION,
      endpoint: env.S3_ENDPOINT,
      credentials:
        env.S3_ACCESS_KEY !== undefined && env.S3_SECRET_KEY !== undefined
          ? { accessKeyId: env.S3_ACCESS_KEY, secretAccessKey: env.S3_SECRET_KEY }
          : undefined,
      forcePathStyle: true,
    });
  }

  async presignPut(
    key: string,
    contentType: string,
    expiresInSeconds: number,
  ): Promise<string> {
    const url = await getSignedUrl(
      this.client(),
      new PutObjectCommand({ Bucket: env.S3_BUCKET, Key: key, ContentType: contentType }),
      { expiresIn: expiresInSeconds },
    );
    log.debug({ action: "presign-put", key }, "upload URL issued");
    return url;
  }

  async presignGet(key: string, expiresInSeconds: number): Promise<string> {
    const url = await getSignedUrl(
      this.client(),
      new GetObjectCommand({ Bucket: env.S3_BUCKET, Key: key }),
      { expiresIn: expiresInSeconds },
    );
    log.debug({ action: "presign-get", key }, "download URL issued");
    return url;
  }
}
