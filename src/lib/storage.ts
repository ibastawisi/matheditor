import {
  CreateBucketCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  PutBucketCorsCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl as presign } from "@aws-sdk/s3-request-presigner";

/**
 * Object storage for revision data and images, any S3 compatible service works
 * (RustFS locally, AWS S3, Cloudflare R2, ...)
 */

const S3_BUCKET = process.env.S3_BUCKET || "matheditor";
const S3_REGION = process.env.S3_REGION || "us-east-1";
const S3_ENDPOINT = process.env.S3_ENDPOINT || "http://localhost:9000";
// signed urls are opened by the browser, which may reach the service at another address than the server
const S3_PUBLIC_ENDPOINT = process.env.S3_PUBLIC_ENDPOINT || S3_ENDPOINT;
const S3_FORCE_PATH_STYLE = process.env.S3_FORCE_PATH_STYLE ? process.env.S3_FORCE_PATH_STYLE === "true" : true;
const S3_ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID || "rustfsadmin";
const S3_SECRET_ACCESS_KEY = process.env.S3_SECRET_ACCESS_KEY || "rustfsadmin";

/** How long the signed urls of images stay valid, they are cached by the client */
export const IMAGE_URL_EXPIRY = 60 * 60 * 24;
/** How long the signed urls of revisions stay valid, they are fetched right away */
export const REVISION_URL_EXPIRY = 60 * 5;

const createClient = (endpoint: string) =>
  new S3Client({
    region: S3_REGION,
    endpoint,
    forcePathStyle: S3_FORCE_PATH_STYLE,
    credentials: {
      accessKeyId: S3_ACCESS_KEY_ID,
      secretAccessKey: S3_SECRET_ACCESS_KEY,
    },
  });

declare global {
  var s3: S3Client | undefined;
  var s3Public: S3Client | undefined;
  var s3BucketReady: Promise<void> | undefined;
}

export const s3 = global.s3 || createClient(S3_ENDPOINT);
const s3Public = global.s3Public || (S3_PUBLIC_ENDPOINT === S3_ENDPOINT ? s3 : createClient(S3_PUBLIC_ENDPOINT));

if (process.env.NODE_ENV !== "production") {
  global.s3 = s3;
  global.s3Public = s3Public;
}

export const bucket = S3_BUCKET;

export const ensureBucket = () => {
  global.s3BucketReady ??= (async () => {
    try {
      await s3.send(new HeadBucketCommand({ Bucket: S3_BUCKET }));
    } catch (error) {
      const status = (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode;
      const name = (error as Error).name;
      if (status !== 404 && name !== "NotFound" && name !== "NoSuchBucket") {
        global.s3BucketReady = undefined;
        throw error;
      }
      await s3.send(new CreateBucketCommand({ Bucket: S3_BUCKET }));
      await s3
        .send(
          new PutBucketCorsCommand({
            Bucket: S3_BUCKET,
            CORSConfiguration: {
              CORSRules: [
                {
                  AllowedOrigins: ["*"],
                  AllowedMethods: ["GET", "PUT", "HEAD"],
                  AllowedHeaders: ["*"],
                  ExposeHeaders: ["ETag"],
                  MaxAgeSeconds: 3600,
                },
              ],
            },
          })
        )
        .catch(() => {});
    }
  })();
  return global.s3BucketReady;
};

export const putObject = async (key: string, body: Uint8Array | string, contentType: string) => {
  await ensureBucket();
  await s3.send(
    new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
      // stored objects never change, a new version gets a new key
      CacheControl: "public, max-age=31536000, immutable",
    })
  );
};

export const putObjectIfAbsent = async (key: string, body: Uint8Array | string, contentType: string) => {
  await ensureBucket();
  try {
    await s3.send(
      new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
        Body: body,
        ContentType: contentType,
        IfNoneMatch: "*",
      })
    );
    return true;
  } catch (error) {
    const status = (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode;
    if (status === 412 || (error as Error).name === "PreconditionFailed") return false;
    throw error;
  }
};

export const objectExists = async (key: string) => {
  await ensureBucket();
  try {
    await s3.send(new HeadObjectCommand({ Bucket: S3_BUCKET, Key: key }));
    return true;
  } catch (error) {
    const status = (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode;
    if (status === 404 || (error as Error).name === "NotFound") return false;
    throw error;
  }
};

export const getObject = async (key: string) => {
  await ensureBucket();
  try {
    const response = await s3.send(new GetObjectCommand({ Bucket: S3_BUCKET, Key: key }));
    if (!response.Body) return null;
    return {
      body: await response.Body.transformToByteArray(),
      contentType: response.ContentType,
    };
  } catch (error) {
    const status = (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode;
    if (status === 404 || (error as Error).name === "NoSuchKey" || (error as Error).name === "NotFound") return null;
    throw error;
  }
};

export const getObjectText = async (key: string) => {
  const object = await getObject(key);
  if (!object) return null;
  return new TextDecoder().decode(object.body);
};

export const deleteObjects = async (keys: string[]) => {
  await ensureBucket();
  // the api deletes up to 1000 objects at a time
  for (let i = 0; i < keys.length; i += 1000) {
    const chunk = keys.slice(i, i + 1000);
    if (!chunk.length) continue;
    await s3.send(
      new DeleteObjectsCommand({
        Bucket: S3_BUCKET,
        Delete: { Objects: chunk.map((Key) => ({ Key })), Quiet: true },
      })
    );
  }
};

export const getSignedDownloadUrl = async (key: string, expiresIn: number) => {
  await ensureBucket();
  return presign(s3Public, new GetObjectCommand({ Bucket: S3_BUCKET, Key: key }), { expiresIn });
};

export const getSignedUploadUrl = async (key: string, contentType: string, expiresIn = 60 * 5) => {
  await ensureBucket();
  return presign(
    s3Public,
    new PutObjectCommand({ Bucket: S3_BUCKET, Key: key, ContentType: contentType }),
    // the uploader has to send the same content type that was signed
    { expiresIn, signableHeaders: new Set(["content-type"]) }
  );
};
