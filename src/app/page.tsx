import GlassCard from "@/components/GlassCard";
import ScreenHeader from "@/components/ScreenHeader";
import ThemeSelector from "@/components/ThemeSelector";
import StoriesRail from "@/components/stories/StoriesRail";

const moments = [
  {
    name: "Luna",
    message: "Saved our stargazing voice note and a cozy photo set.",
    time: "9:14 PM",
  },
  {
    name: "Kai",
    message: "Pinned the sunset playlist for tonight's drive.",
    time: "8:02 PM",
  },
  {
    name: "Luna",
    message: "Added a secret gallery folder called Moonlit.",
    time: "Yesterday",
  },
];

export default function Home() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-7">
      <ScreenHeader
        title="Lumen Duo"
        subtitle="Your private neon space, ready for tonight's moment."
        right={
          <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] text-white/70">
            Online
          </div>
        }
      />

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-white">Stories</h3>
          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] uppercase tracking-[0.2em] text-white/60">
            Live
          </span>
        </div>
        <StoriesRail showEmptyState />
      </section>

      <GlassCard className="bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.15),_transparent_55%)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.35em] text-white/50">
              Tonight's Spark
            </p>
            <h2 className="mt-3 text-[22px] font-semibold text-white">
              Midnight walk + soft jazz
            </h2>
            <p className="mt-2 text-sm text-white/65">
              A curated moment to drop into your shared space.
            </p>
          </div>
          <button
            type="button"
            className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80"
          >
            Save
          </button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {[
            "Voice note",
            "Private album",
            "Playlist",
            "Date idea",
          ].map((label) => (
            <span
              key={label}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/70"
            >
              {label}
            </span>
          ))}
        </div>
      </GlassCard>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-white">Recent moments</h3>
          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] uppercase tracking-[0.2em] text-white/60">
            3 new
          </span>
        </div>
        <div className="space-y-3">
          {moments.map((moment) => (
            <div
              key={`${moment.name}-${moment.time}`}
              className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-white">
                {moment.name[0]}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-white">{moment.name}</p>
                  <p className="text-xs text-white/50">{moment.time}</p>
                </div>
                <p className="text-xs text-white/65">{moment.message}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-base font-semibold text-white">Theme aura</h3>
        <ThemeSelector />
      </section>
    </div>
  );
}
