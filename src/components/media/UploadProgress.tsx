export default function UploadProgress({ value }: { value: number }) {
  return (
    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
      <div
        className="h-full rounded-full bg-white/60 transition-all"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}
