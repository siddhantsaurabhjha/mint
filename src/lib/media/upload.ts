import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { CloudinarySignature } from "@/lib/media/cloudinary";

export type UploadResult = {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  duration?: number;
  format?: string;
};

export async function getUploadSignature(
  folder: string,
  resourceType: "image" | "video"
) {
  const response = await fetch("/api/cloudinary/sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ folder, resourceType }),
  });

  if (!response.ok) {
    throw new Error("Failed to sign upload.");
  }

  return (await response.json()) as CloudinarySignature;
}

export async function uploadToCloudinary(
  signature: CloudinarySignature,
  file: File,
  onProgress?: (progress: number) => void
) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", signature.apiKey);
  formData.append("timestamp", signature.timestamp.toString());
  formData.append("signature", signature.signature);
  formData.append("folder", signature.folder);

  const request = new XMLHttpRequest();

  const result = await new Promise<UploadResult>((resolve, reject) => {
    request.upload.onprogress = (event) => {
      if (!event.lengthComputable || !onProgress) return;
      onProgress(Math.round((event.loaded / event.total) * 100));
    };

    request.onerror = () => reject(new Error("Upload failed"));
    request.onload = () => {
      if (request.status >= 200 && request.status < 300) {
        const data = JSON.parse(request.responseText) as {
          secure_url: string;
          public_id: string;
          width?: number;
          height?: number;
          duration?: number;
          format?: string;
        };
        resolve({
          url: data.secure_url,
          publicId: data.public_id,
          width: data.width,
          height: data.height,
          duration: data.duration,
          format: data.format,
        });
      } else {
        reject(new Error("Upload failed"));
      }
    };

    request.open(
      "POST",
      `https://api.cloudinary.com/v1_1/${signature.cloudName}/${signature.resourceType}/upload`
    );
    request.send(formData);
  });

  return result;
}

export async function deleteCloudinaryAsset(publicId: string, type: "image" | "video") {
  const supabase = getSupabaseBrowserClient();
  await supabase.functions.invoke("cloudinary-delete", {
    body: { publicId, type },
  });
}
