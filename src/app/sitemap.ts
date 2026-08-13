import type { MetadataRoute } from "next";
import { listDtcCodes } from "@/lib/dtc";
import { SITE_URL as BASE_URL } from "@/lib/constants";
import { listGuideSlugs } from "@/lib/warning-lights";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const staticRoutes: Array<{ path: string; priority: number; changeFrequency: "daily" | "weekly" | "monthly" }> = [
    { path: "", priority: 1, changeFrequency: "weekly" },
    { path: "/diagnose", priority: 0.9, changeFrequency: "weekly" },
    { path: "/vin", priority: 0.8, changeFrequency: "weekly" },
    { path: "/obd-codes", priority: 0.8, changeFrequency: "weekly" },
    { path: "/guides", priority: 0.8, changeFrequency: "weekly" },
    { path: "/faq", priority: 0.7, changeFrequency: "monthly" },
    { path: "/history", priority: 0.5, changeFrequency: "monthly" },
    { path: "/legal/terms", priority: 0.3, changeFrequency: "monthly" },
    { path: "/legal/privacy", priority: 0.3, changeFrequency: "monthly" },
    { path: "/legal/contact", priority: 0.3, changeFrequency: "monthly" },
    { path: "/legal/refunds", priority: 0.2, changeFrequency: "monthly" },
  ];

  const dtcPages: MetadataRoute.Sitemap = listDtcCodes().map((code) => ({
    url: `${BASE_URL}/obd-codes/${code}`,
    lastModified,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const guidePages: MetadataRoute.Sitemap = listGuideSlugs().map((slug) => ({
    url: `${BASE_URL}/guides/${slug}`,
    lastModified,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [
    ...staticRoutes.map(({ path, priority, changeFrequency }) => ({
      url: `${BASE_URL}${path}`,
      lastModified,
      changeFrequency,
      priority,
    })),
    ...dtcPages,
    ...guidePages,
  ];
}
