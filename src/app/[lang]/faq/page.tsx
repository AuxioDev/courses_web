import type { Metadata } from "next";
import { getI18n } from "@/i18n";
import { contacts } from "@/lib/site";
import { jsonLd, pageMeta } from "@/lib/meta";
import { PageHead } from "@/components/page-head";

export async function generateMetadata(): Promise<Metadata> {
  const { locale, t } = await getI18n();
  return pageMeta(locale, "/faq", t.faq.title, t.faq.lead);
}

export default async function FaqPage() {
  const { t } = await getI18n();
  const f = t.faq;
  const c = contacts();
  const items = [
    [f.q1, f.a1],
    [f.q2, f.a2],
    [f.q3, f.a3],
    [f.q4, f.a4],
    [f.q5, f.a5],
    [f.q6, f.a6],
    [f.q7, f.a7],
    [f.q8, f.a8],
    [f.q9, f.a9],
  ];
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: items.map(([name, text]) => ({ "@type": "Question", name, acceptedAnswer: { "@type": "Answer", text } })),
          }),
        }}
      />
      <PageHead title={f.title} lead={f.lead} />
      <div className="faq">
        {items.map(([question, answer]) => (
          <details key={question} className="reveal">
            <summary>{question}</summary>
            <p>{answer}</p>
          </details>
        ))}
      </div>
      <section className="faq-more" aria-labelledby="more">
        <h2 id="more">{f.moreTitle}</h2>
        <p>{f.moreBody}</p>
        <a href={c.phoneHref} className="num link font-semibold">
          {c.phone}
        </a>
      </section>
    </>
  );
}
