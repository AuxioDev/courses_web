import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft } from "./icons";

export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="back-link mb-0 sm:mb-3">
      <ChevronLeft width={18} height={18} /> {children}
    </Link>
  );
}

export function PageHead({ title, lead }: { title: string; lead?: ReactNode }) {
  return (
    <div className="mb-6 max-w-3xl">
      <h1>{title}</h1>
      {lead && <p className="page-lead">{lead}</p>}
    </div>
  );
}

// Text an admin typed in: paragraphs are kept, nothing else is interpreted.
export function Prose({ text }: { text: string }) {
  return (
    <div className="prose max-w-[68ch] space-y-3 leading-relaxed">
      {text
        .split(/\n{2,}/)
        .filter((p) => p.trim())
        .map((paragraph, i) => (
          <p key={i} className="whitespace-pre-line">
            {paragraph.trim()}
          </p>
        ))}
    </div>
  );
}
