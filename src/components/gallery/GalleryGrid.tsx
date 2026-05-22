"use client";

import type { GalleryItem } from "@/lib/gallery/useGallery";

export default function GalleryGrid({
  items,
  onOpen,
}: {
  items: GalleryItem[];
  onOpen: (url: string) => void;
}) {
  return (
    <div className="columns-2 gap-4 [column-fill:_balance]">
      {items.map((item) => (
        <div key={item.id} className="mb-4 break-inside-avoid">
          <button
            type="button"
            onClick={() => onOpen(item.media_url ?? "")}
            className="relative w-full overflow-hidden rounded-2xl border border-white/10 bg-white/5"
          >
            {item.thumbnail_url || item.media_url ? (
              <img
                src={item.thumbnail_url ?? item.media_url ?? ""}
                alt={item.title ?? "Gallery"}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-40 items-center justify-center text-[11px] uppercase tracking-[0.2em] text-white/60">
                Empty
              </div>
            )}
          </button>
        </div>
      ))}
    </div>
  );
}
