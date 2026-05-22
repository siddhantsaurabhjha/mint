export default function ChatSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((row) => (
        <div
          key={row}
          className="rounded-3xl border border-white/10 bg-white/5 px-4 py-4"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-white/10" />
            <div className="space-y-2">
              <div className="h-3 w-24 rounded-full bg-white/10" />
              <div className="h-3 w-36 rounded-full bg-white/5" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
