"use client";

import { useRef, useState } from "react";
import ScreenHeader from "@/components/ScreenHeader";
import GalleryGrid from "@/components/gallery/GalleryGrid";
import GalleryViewer from "@/components/gallery/GalleryViewer";
import UploadProgress from "@/components/media/UploadProgress";
import { useAuth } from "@/components/AuthProvider";
import { useGallery, type GalleryItem } from "@/lib/gallery/useGallery";
import { ROOM_ID } from "@/lib/chat/constants";
import { getUploadSignature, uploadToCloudinary, deleteCloudinaryAsset } from "@/lib/media/upload";
import { extractCloudinaryPublicId } from "@/lib/media/cloudinary";

const GALLERY_FOLDER = "lumen-duo/gallery";

export default function GalleryPage() {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const { items, isLoading, addItem, deleteItem } = useGallery(ROOM_ID);
  const [activeItem, setActiveItem] = useState<GalleryItem | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleUpload = async (file: File) => {
    if (!userId) return;
    setIsUploading(true);
    setUploadProgress(0);
    const isVideo = file.type.startsWith("video");
    try {
      const signature = await getUploadSignature(GALLERY_FOLDER, isVideo ? "video" : "image");
      const result = await uploadToCloudinary(signature, file, setUploadProgress);
      await addItem({
        ownerId: userId,
        type: isVideo ? "video" : "image",
        title: null,
        mediaUrl: result.url,
        thumbnailUrl: null,
        metadata: { publicId: result.publicId, width: result.width, height: result.height },
      });
    } finally {
      setUploadProgress(null);
      setIsUploading(false);
    }
  };

  const handleDelete = async (item: GalleryItem) => {
    const publicId =
      (item.metadata && typeof item.metadata.publicId === "string" && item.metadata.publicId) ||
      (item.media_url ? extractCloudinaryPublicId(item.media_url) : null);
    if (publicId) {
      await deleteCloudinaryAsset(publicId, item.type === "video" ? "video" : "image");
    }
    await deleteItem(item.id);
    setActiveItem(null);
  };

  const handleDownload = async (item: GalleryItem) => {
    if (!item.media_url) return;

    const publicId =
      (item.metadata && typeof item.metadata.publicId === "string" && item.metadata.publicId) ||
      extractCloudinaryPublicId(item.media_url);
    const cloudName = (() => {
      try {
        const parsed = new URL(item.media_url ?? "");
        const match = parsed.hostname.match(/^res\.cloudinary\.com$/);
        if (!match) return null;
        const parts = parsed.pathname.split("/").filter(Boolean);
        return parts[0] ?? null;
      } catch {
        return null;
      }
    })();

    const format = (() => {
      try {
        const parsed = new URL(item.media_url ?? "");
        const pathname = parsed.pathname;
        const lastDot = pathname.lastIndexOf(".");
        if (lastDot === -1) return null;
        return pathname.slice(lastDot + 1) || null;
      } catch {
        return null;
      }
    })();

    const downloadUrl =
      item.type === "image" && publicId && cloudName
        ? `https://res.cloudinary.com/${cloudName}/image/upload/${publicId}${
            format ? `.${format}` : ""
          }`
        : item.media_url;

    const fileBase = publicId ? publicId.split("/").pop() ?? "lumen-duo" : "lumen-duo";
    const fileName = format ? `${fileBase}.${format}` : fileBase;

    try {
      const response = await fetch(downloadUrl, { mode: "cors" });
      if (!response.ok) throw new Error("Download failed");
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(downloadUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6">
      <ScreenHeader
        title="Gallery"
        subtitle="Shared neon memories, pinned forever."
        right={
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] text-white/70"
          >
            Upload
          </button>
        }
      />

      {isUploading && uploadProgress !== null ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-3">
          <p className="text-sm text-white/70">Uploading to gallery...</p>
          <UploadProgress value={uploadProgress} />
        </div>
      ) : null}

      {isLoading ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/70">
          Loading gallery...
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/70">
          The shared gallery is empty. Upload a memory.
        </div>
      ) : (
        <GalleryGrid items={items} onOpen={(item) => setActiveItem(item)} />
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          handleUpload(file);
          event.target.value = "";
        }}
      />

      <GalleryViewer
        item={activeItem}
        onClose={() => setActiveItem(null)}
        onDelete={(item) => handleDelete(item)}
        onDownload={handleDownload}
      />
    </div>
  );
}
