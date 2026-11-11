import type { SVGProps } from "react";

const base = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

export function ChevronLeft(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="m15 5-7 7 7 7" />
    </svg>
  );
}

// The school's mark: a timetable sheet pinned to the board, one lesson filled in.
export function Mark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width={28} height={28} viewBox="0 0 32 32" aria-hidden {...props}>
      <rect x="3" y="5" width="26" height="24" rx="5" fill="var(--accent)" />
      <path d="M3 13h26M12 13v16M21 13v16" stroke="var(--accent-ink)" strokeWidth="1.6" opacity="0.55" />
      <rect x="13.6" y="16" width="5.8" height="9" rx="1.6" fill="var(--marker)" />
      <circle cx="16" cy="5.5" r="3" fill="var(--marker)" stroke="var(--accent)" strokeWidth="1.4" />
    </svg>
  );
}
