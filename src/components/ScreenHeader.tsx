import type { ReactNode } from "react";

export default function ScreenHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <header className="flex items-start justify-between gap-4 pb-5">
      <div>
        <p className="text-[11px] uppercase tracking-[0.45em] text-white/45">
          Private Couple Space
        </p>
        <h1 className="mt-3 text-[32px] font-semibold leading-tight text-white">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-2 text-sm text-white/60">{subtitle}</p>
        ) : null}
      </div>
      {right ? <div className="pt-3">{right}</div> : null}
    </header>
  );
}
