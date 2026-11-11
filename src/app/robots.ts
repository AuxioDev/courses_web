import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    // The form and its confirmation are not content.
    rules: { userAgent: "*", allow: "/", disallow: ["/az/apply", "/en/apply", "/ru/apply"] },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
