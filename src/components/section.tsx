import type { ReactNode } from "react";

// One section of the sheet: the title (and a short line under it) in a narrow left column, the content in a wide
// right one. Below 900 px they stack. The hairline above is part of the section.
// `wide` puts the title above the content instead of beside it, for content that needs the whole width (the week).
export function Section({ id, title, lead, wide = false, children }: { id: string; title: string; lead?: string; wide?: boolean; children: ReactNode }) {
  const heading = `${id}-title`;
  return (
    <section id={id} aria-labelledby={heading} className={`sec scroll-mt-20 ${wide ? "sec-wide" : ""}`}>
      <div>
        <h2 id={heading}>{title}</h2>
        {lead && <p className="sec-lead">{lead}</p>}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}
