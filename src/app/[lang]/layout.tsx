import type { Metadata, Viewport } from "next";
import { Onest, Unbounded } from "next/font/google";
import { lang } from "next/root-params";
import { locales } from "@/i18n/config";
import { getI18n } from "@/i18n";
import { ogLocale } from "@/lib/meta";
import { SCHOOL_NAME, siteUrl } from "@/lib/site";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import "../globals.css";
import "../role-theme.css";
import "../motion.css";

const bodyFont = Onest({
  // The shared stylesheet names its sans variable after Geist, so this keeps that name.
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext", "cyrillic"],
  display: "swap",
  // Preloading would fetch all three alphabets on every visit; the browser fetches only the ranges the text uses.
  preload: false,
});

// Headings only: the wide lettering of a notice board.
const displayFont = Unbounded({
  variable: "--font-display",
  subsets: ["latin", "latin-ext", "cyrillic"],
  weight: ["500", "600"],
  display: "swap",
  preload: false,
});

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata(): Promise<Metadata> {
  const { locale, t } = await getI18n();
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: SCHOOL_NAME, template: `%s | ${SCHOOL_NAME}` },
    description: t.meta.description,
    applicationName: SCHOOL_NAME,
    icons: { icon: "/icon.svg" },
    openGraph: { type: "website", siteName: SCHOOL_NAME, locale: ogLocale(locale), description: t.meta.description },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfcff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1830" },
  ],
};

export default async function RootLayout({ children }: LayoutProps<"/[lang]">) {
  const { locale, t } = await getI18n();
  return (
    <html lang={await lang()} className={`${bodyFont.variable} ${displayFont.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <a href="#content" className="btn sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-30">
          {t.nav.skip}
        </a>
        <SiteHeader locale={locale} t={t} />
        <main id="content" className="mx-auto w-full max-w-6xl flex-1 px-4 pt-6 sm:px-6 md:pt-10">
          {children}
        </main>
        <SiteFooter locale={locale} t={t} />
      </body>
    </html>
  );
}
