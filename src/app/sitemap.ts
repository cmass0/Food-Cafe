import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site-config";

const publicRoutes = ["/", "/recipes", "/combos", "/posts", "/ranking"];

export default function sitemap(): MetadataRoute.Sitemap {
  return publicRoutes.map((route) => ({
    url: new URL(route, SITE_URL).toString(),
    changeFrequency: route === "/" ? "daily" : "weekly",
    priority: route === "/" ? 1 : 0.8,
  }));
}
