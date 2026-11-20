import type { Metadata, Viewport } from "next";
import { Inter, Manrope } from "next/font/google";
import { lang } from "next/root-params";
import { locales } from "@/i18n/config";
import { getI18n } from "@/i18n";
import { ogLocale } from "@/lib/meta";
import { SCHOOL_NAME, siteUrl } from "@/lib/site";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import "../globals.css";
import "../role-theme.css";
import "../motion.css";
import "../brand.css";
import "../dark-theme.css";
import "../site-theme.css";
import { ThemeBoot } from "@/components/theme-boot";

// Inter for everything you read or tap. The shared stylesheet names its sans variable after Geist, so this keeps that name.
const bodyFont = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext", "cyrillic"],
  display: "swap",
  // Preloading would fetch all three alphabets on every visit; the browser fetches only the ranges the text uses.
  preload: false,
});

// Headlines, buttons, the navigation bar and other UI labels: Manrope, a variable font, so every weight comes from one
// file. It covers Azerbaijani (Latin Extended) and Russian (Cyrillic). It is preloaded, so the headline neither flashes
// nor re-wraps.
const displayFont = Manrope({
  variable: "--font-display",
  subsets: ["latin", "latin-ext", "cyrillic"],
  display: "swap",
  preload: true,
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
  themeColor: "#ffffff",
};

export default async function RootLayout({ children }: LayoutProps<"/[lang]">) {
  const { locale, t } = await getI18n();
  return (
    <html lang={await lang()} className={`${bodyFont.variable} ${displayFont.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="flex min-h-full flex-col font-sans">
        <ThemeBoot />
        <a href="#content" className="btn sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-30">
          {t.nav.skip}
        </a>
        <SiteHeader locale={locale} t={t} />
        <main id="content" className="mx-auto w-full max-w-[75rem] flex-1 px-5 pb-20 pt-8 sm:px-8 md:pb-28 md:pt-12 lg:px-12">
          {children}
        </main>
        <SiteFooter locale={locale} t={t} />
      </body>
    </html>
  );
}
