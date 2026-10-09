import type { APIRoute } from "astro";
import { getWpArticles, getWpEvents } from "../lib/wordpress";

export const prerender = false;

const STATIC_PATHS = [
  "/",
  "/oferta",
  "/mix-mastering",
  "/ebooki",
  "/artykuly",
  "/wydarzenia",
  "/dolacz-do-nas",
  "/zarzad-fundacji",
  "/numer-konta-bankowego",
  "/dokumenty",
  "/regulamin",
  "/polityka-prywatnosci",
  "/polityka-cookies",
];

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export const GET: APIRoute = async ({ site }) => {
  const origin = site?.href?.replace(/\/$/, "") || "https://gospodadobregodzwieku.pl";
  const [articles, events] = await Promise.all([
    getWpArticles({ limit: 100 }),
    getWpEvents({ limit: 100 }),
  ]);

  const entries = [
    ...STATIC_PATHS.map((path) => ({ path, lastmod: undefined as string | undefined })),
    ...articles.map((article) => ({ path: article.link, lastmod: article.date })),
    ...events.map((event) => ({ path: event.link, lastmod: event.date })),
  ];

  const uniqueEntries = [...new Map(entries.map((entry) => [entry.path, entry])).values()];
  const urls = uniqueEntries
    .map(({ path, lastmod }) => {
      const loc = escapeXml(new URL(path, origin).href);
      const normalizedDate = lastmod && !Number.isNaN(Date.parse(lastmod))
        ? new Date(lastmod).toISOString()
        : undefined;
      return `  <url>\n    <loc>${loc}</loc>${normalizedDate ? `\n    <lastmod>${normalizedDate}</lastmod>` : ""}\n  </url>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
};
