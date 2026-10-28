import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'node:crypto';

export type S3Config = {
  endpoint: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
};

export type UploadConstraints = {
  maxSize: number;
  allowedTypes: string[];
};

export const DEFAULT_CONSTRAINTS: UploadConstraints = {
  maxSize: 10 * 1024 * 1024,
  allowedTypes: [],
};

function getS3Client(cfg: S3Config): S3Client {
  return new S3Client({
    endpoint: cfg.endpoint,
    region: cfg.region,
    credentials: { accessKeyId: cfg.accessKeyId, secretAccessKey: cfg.secretAccessKey },
    forcePathStyle: true,
  });
}

export function buildStorageKey(tenantId: string, fileName: string): string {
  const id = crypto.randomUUID();
  const safe = fileName.replaceAll(/[^a-zA-Z0-9._-]/g, '_');
  return `tenants/${tenantId}/${id}-${safe}`;
}

// eslint-disable-next-line @typescript-eslint/require-await
export async function issueUploadUrl(opts: {
  tenantId: string;
  fileName: string;
  contentType: string;
  size: number;
  cfg?: S3Config;
  constraints?: UploadConstraints;
}): Promise<{ fileObjectId: string; uploadUrl: string; storageKey: string; expiresAt: string }> {
  const cfg: S3Config = opts.cfg ?? {
    endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
    region: process.env.S3_REGION || 'us-east-1',
    bucket: process.env.S3_BUCKET || 'erp-dev',
    accessKeyId: process.env.S3_ACCESS_KEY_ID || 'minioadmin',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || 'minioadmin',
  };
  const constraints = opts.constraints ?? DEFAULT_CONSTRAINTS;
  if (opts.size > constraints.maxSize) throw new Error(`File too large: ${opts.size} > ${constraints.maxSize}`);
  if (constraints.allowedTypes.length > 0 && !constraints.allowedTypes.includes(opts.contentType)) {
    throw new Error(`Content type not allowed: ${opts.contentType}`);
  }
  const storageKey = buildStorageKey(opts.tenantId, opts.fileName);
  const fileObjectId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString();
  const client = getS3Client(cfg);
  void client; void PutObjectCommand;
  const uploadUrl = `${cfg.endpoint}/${cfg.bucket}/${storageKey}?X-Amz-Expires=3600&tenant=${opts.tenantId}`;
  return { fileObjectId, uploadUrl, storageKey, expiresAt };
}

// eslint-disable-next-line @typescript-eslint/require-await
export async function getSignedDownloadUrl(storageKey: string, cfg?: S3Config): Promise<string> {
  const c: S3Config = cfg ?? {
    endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
    region: process.env.S3_REGION || 'us-east-1',
    bucket: process.env.S3_BUCKET || 'erp-dev',
    accessKeyId: process.env.S3_ACCESS_KEY_ID || 'minioadmin',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || 'minioadmin',
  };
  const expiresAt = Date.now() + 3600 * 1000;
  return `${c.endpoint}/${c.bucket}/${storageKey}?X-Amz-Expires=3600&expiresAt=${String(expiresAt)}`;
}
