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

export function ArrowRight(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M5 12h14M13 6l6 6-6 6" />
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

// Line icons for the three things that make the lessons what they are.
export function Video(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="6" width="13" height="12" rx="2.5" />
      <path d="m16 10.5 5-3v9l-5-3" />
    </svg>
  );
}

export function Notebook(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <rect x="5" y="3" width="14" height="18" rx="2.5" />
      <path d="M9 8h6M9 12h6M9 16h3" />
    </svg>
  );
}

export function People(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <circle cx="9" cy="8" r="3.25" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <path d="M16 5.2a3.25 3.25 0 0 1 0 5.6M18 14.4c1.9.9 3 2.8 3 5.6" />
    </svg>
  );
}
