import type { ReactNode } from "react";

/* ------------------------------------------------------------------ */

export function Card({
  children,
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article";
}) {
  return (
    <Tag
      className={`rounded-3xl border border-navy/10 bg-paper p-5 shadow-soft ${className}`}
    >
      {children}
    </Tag>
  );
}

/* ------------------------------------------------------------------ */

export type BannerTone = "info" | "tip" | "danger" | "success" | "neutral";

const BANNER_TONES: Record<BannerTone, string> = {
  info: "bg-navy/6 border-navy/25 text-navy",
  tip: "bg-sun-soft border-sun text-navy",
  danger: "bg-coral-soft border-coral text-navy",
  success: "bg-teal-soft border-teal text-navy",
  neutral: "bg-paper border-navy/15 text-navy",
};

export function Banner({
  tone = "info",
  icon,
  title,
  children,
  className = "",
}: {
  tone?: BannerTone;
  icon?: ReactNode;
  title?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      role="note"
      className={`flex items-start gap-3 rounded-2xl border-2 p-4 ${BANNER_TONES[tone]} ${className}`}
    >
      {icon ? <span className="mt-0.5 shrink-0">{icon}</span> : null}
      <div className="min-w-0">
        {title ? <p className="text-base font-extrabold">{title}</p> : null}
        {children ? (
          <div className={title ? "mt-1 text-base" : "text-base"}>{children}</div>
        ) : null}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-4" role="status" aria-live="polite">
      <svg viewBox="0 0 50 50" className="h-14 w-14 animate-spin" aria-hidden="true">
        <circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke="#17324D"
          strokeOpacity="0.15"
          strokeWidth="6"
        />
        <circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke="#0F9D8A"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray="90 160"
        />
      </svg>
      {label ? <p className="text-center text-lg font-bold text-navy">{label}</p> : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */

export function ProgressBar({ value, label }: { value: number; label?: string }) {
  const pct = Math.max(0, Math.min(100, Math.round(value * 100)));
  return (
    <div className="w-full">
      <div
        className="h-4 w-full overflow-hidden rounded-full bg-navy/12"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div
          className="h-full rounded-full bg-teal transition-[width] duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="mt-8 mb-3 text-xl font-extrabold text-navy sm:text-2xl">{children}</h2>
  );
}

/* ------------------------------------------------------------------ */

export function NumberedList({ items }: { items: string[] }) {
  return (
    <ol className="space-y-3">
      {items.map((item, index) => (
        <li key={item} className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy text-sm font-extrabold text-white"
          >
            {index + 1}
          </span>
          <span className="text-lg leading-snug">{item}</span>
        </li>
      ))}
    </ol>
  );
}

/* ------------------------------------------------------------------ */

export function Divider() {
  return <hr className="my-6 border-navy/10" />;
}
