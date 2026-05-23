"use client";

import { useRef, useState } from "react";
import { Plus } from "lucide-react";
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
    <div className="mx-auto flex h-[calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-8px)] w-full max-w-md flex-col overflow-hidden">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[linear-gradient(180deg,rgba(33,20,52,0.98),rgba(19,12,31,0.98))] px-4 pt-[calc(12px+env(safe-area-inset-top))] pb-3 shadow-[0_10px_22px_rgba(0,0,0,0.25)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[30px] font-semibold leading-tight text-white">Gallery</h1>
            <p className="mt-1 text-xs text-white/65">Shared your lovable memories.</p>
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-1 flex h-11 w-11 items-center justify-center rounded-full border border-fuchsia-300/25 bg-[linear-gradient(140deg,rgba(114,63,240,0.95),rgba(64,39,122,0.95))] text-white shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_0_18px_rgba(126,77,255,0.28)] transition active:scale-95"
            aria-label="Upload memory"
          >
            <Plus size={18} strokeWidth={2.1} />
          </button>
        </div>
      </header>

      <section className="flex-1 overflow-y-auto scroll-smooth px-0">
        <div className="px-1 py-4">
          {isUploading && uploadProgress !== null ? (
            <div className="mx-3 mb-4 rounded-3xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-sm text-white/70">Uploading to gallery...</p>
              <UploadProgress value={uploadProgress} />
            </div>
          ) : null}

          {isLoading ? (
            <div className="mx-3 rounded-3xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/70">
              Loading gallery...
            </div>
          ) : items.length === 0 ? (
            <div className="mx-3 rounded-3xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/70">
              The shared gallery is empty. Upload a memory.
            </div>
          ) : (
            <GalleryGrid items={items} onOpen={(item) => setActiveItem(item)} />
          )}
        </div>
      </section>

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
