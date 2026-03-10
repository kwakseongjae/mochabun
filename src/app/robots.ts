import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

// Auth-required or non-public paths — shared across all user agent rules
const DISALLOW_PATHS = [
  "/api/",
  "/auth",
  "/complete",
  "/archive",
  "/favorites",
  "/team-spaces",
  "/interview",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Default: allow all public pages
      {
        userAgent: "*",
        allow: "/",
        disallow: DISALLOW_PATHS,
      },
      // AI Search bots: explicitly allow (GEO visibility)
      {
        userAgent: "ChatGPT-User",
        allow: "/",
        disallow: DISALLOW_PATHS,
      },
      {
        userAgent: "Claude-SearchBot",
        allow: "/",
        disallow: DISALLOW_PATHS,
      },
      {
        userAgent: "PerplexityBot",
        allow: "/",
        disallow: DISALLOW_PATHS,
      },
      // AI Training bots: allow (builds entity recognition)
      {
        userAgent: "GPTBot",
        allow: "/",
        disallow: DISALLOW_PATHS,
      },
      {
        userAgent: "ClaudeBot",
        allow: "/",
        disallow: DISALLOW_PATHS,
      },
      {
        userAgent: "Google-Extended",
        allow: "/",
        disallow: DISALLOW_PATHS,
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
