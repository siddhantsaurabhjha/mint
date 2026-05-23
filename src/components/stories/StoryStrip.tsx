"use client";

type StoryStripItem = {
  id: string;
  userId: string;
  username: string;
  coverUrl: string | null;
  isSeen: boolean;
};

export default function StoryStrip({
  items,
  onOpen,
  onCreate,
  showAdd = true,
  addLabel = "Add",
}: {
  items: StoryStripItem[];
  onOpen: (id: string) => void;
  onCreate?: () => void;
  showAdd?: boolean;
  addLabel?: string;
}) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {showAdd ? (
        <button
          type="button"
          onClick={onCreate}
          className="flex min-w-20.5 flex-col items-center gap-2"
        >
          <div className="relative h-16 w-16 rounded-3xl border border-white/20 bg-white/10">
            <div className="absolute inset-0 flex items-center justify-center text-lg text-white">
              +
            </div>
          </div>
          <span className="text-[10px] uppercase tracking-[0.2em] text-white/60">
            {addLabel}
          </span>
        </button>
      ) : null}
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onOpen(item.id)}
          className="flex min-w-20.5 flex-col items-center gap-2"
        >
          <div
            className={`relative h-16 w-16 rounded-3xl border bg-white/10 ${
              item.isSeen
                ? "border-white/20"
                : "border-accent shadow-[0_0_18px_rgba(179,71,255,0.45)]"
            }`}
          >
            {item.coverUrl ? (
              <img
                src={item.coverUrl}
                alt={item.username}
                loading="lazy"
                className="h-full w-full rounded-3xl object-cover"
              />
            ) : null}
            <div className="absolute inset-0 rounded-3xl bg-linear-to-t from-black/40 to-transparent" />
          </div>
          <span className="text-[10px] uppercase tracking-[0.2em] text-white/60">
            {item.username}
          </span>
        </button>
      ))}
    </div>
  );
}
