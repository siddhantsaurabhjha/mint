import crypto from "crypto";

export type CloudinarySignature = {
  timestamp: number;
  signature: string;
  apiKey: string;
  cloudName: string;
  folder: string;
  resourceType: "image" | "video";
};

const getEnv = () => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary env vars are missing.");
  }

  return { cloudName, apiKey, apiSecret };
};

export function signCloudinaryUpload(params: {
  folder: string;
  resourceType: "image" | "video";
}) {
  const { cloudName, apiKey, apiSecret } = getEnv();
  const timestamp = Math.floor(Date.now() / 1000);
  const payload = `folder=${params.folder}&timestamp=${timestamp}`;
  const signature = crypto
    .createHash("sha1")
    .update(payload + apiSecret)
    .digest("hex");

  return {
    timestamp,
    signature,
    apiKey,
    cloudName,
    folder: params.folder,
    resourceType: params.resourceType,
  } as CloudinarySignature;
}

export function getCloudinaryUploadUrl(signature: CloudinarySignature) {
  return `https://api.cloudinary.com/v1_1/${signature.cloudName}/${signature.resourceType}/upload`;
}
