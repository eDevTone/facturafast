import {
  DeleteObjectsCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

const BUCKET = process.env.R2_BUCKET_NAME!

function buildKey(userId: string, uuid: string, ext: 'xml' | 'pdf'): string {
  return `invoices/${userId}/${uuid}.${ext}`
}

/**
 * Upload a file (XML or PDF) to R2
 * @returns The storage key for the uploaded file
 */
export async function uploadFile(
  userId: string,
  uuid: string,
  buffer: Buffer,
  type: 'xml' | 'pdf',
): Promise<string> {
  const key = buildKey(userId, uuid, type)

  await r2.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: type === 'xml' ? 'application/xml' : 'application/pdf',
    }),
  )

  return key
}

/**
 * Upload a file with a custom key and content type to R2
 * @returns The storage key for the uploaded file
 */
export async function uploadRawFile(
  key: string,
  buffer: Buffer,
  contentType: string,
): Promise<string> {
  await r2.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }),
  )

  return key
}

/**
 * Generate a temporary signed URL for downloading a file from R2
 * @param key - The storage key returned by uploadFile
 * @param expiresIn - URL expiration in seconds (default: 1 hour)
 */
export async function getFileSignedUrl(
  key: string,
  expiresIn = 3600,
): Promise<string> {
  return getSignedUrl(
    r2,
    new GetObjectCommand({ Bucket: BUCKET, Key: key }),
    { expiresIn },
  )
}

/**
 * Delete all files associated with an invoice UUID (XML + PDF)
 */
export async function deleteFiles(userId: string, uuid: string): Promise<void> {
  await r2.send(
    new DeleteObjectsCommand({
      Bucket: BUCKET,
      Delete: {
        Objects: [
          { Key: buildKey(userId, uuid, 'xml') },
          { Key: buildKey(userId, uuid, 'pdf') },
        ],
      },
    }),
  )
}
