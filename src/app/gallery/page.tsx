import GlassCard from "@/components/GlassCard";
import ScreenHeader from "@/components/ScreenHeader";

const placeholders = [
  { label: "Luna-Kai 01", height: "h-40" },
  { label: "Night Drive", height: "h-56" },
  { label: "Moonlit", height: "h-44" },
  { label: "Soft Glow", height: "h-60" },
  { label: "Private", height: "h-48" },
  { label: "Shared", height: "h-52" },
];

export default function GalleryPage() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6">
      <ScreenHeader
        title="Gallery"
        subtitle="A curated grid for your shared memories."
      />

      <GlassCard className="bg-white/7">
        <p className="text-sm text-white/70">
          Gallery sync and secure storage ship in Phase 2. For now, the layout
          prepares the experience.
        </p>
      </GlassCard>

      <div className="columns-2 gap-4 [column-fill:_balance]">
        {placeholders.map((item) => (
          <div key={item.label} className="mb-4 break-inside-avoid">
            <div
              className={`relative overflow-hidden rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.16),_transparent_60%)] ${item.height} shadow-[0_20px_40px_rgba(0,0,0,0.35)]`}
            >
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(12,14,24,0.1),rgba(10,10,16,0.6))]" />
              <div className="absolute left-3 right-3 top-3 flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-white/60">
                <span>Private</span>
                <span>Love</span>
              </div>
              <div className="absolute bottom-3 left-3 right-3">
                <p className="text-sm font-semibold text-white">{item.label}</p>
                <p className="text-[11px] text-white/60">
                  12 photos • 2 notes
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
