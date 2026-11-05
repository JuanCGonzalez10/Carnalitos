import type { MetadataRoute } from "next";

import { SITE_URL as baseUrl } from "@/lib/utils/siteUrl";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/tienda", "/nosotros", "/contacto", "/carrito", "/pedido"];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: route === "" ? 1 : 0.7,
  }));
}
