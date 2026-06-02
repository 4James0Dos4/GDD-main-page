import { pickRelatedArticles, slugifyCategory } from "./articleUtils";
import { pickRelatedEvents } from "./eventUtils";

export type WpCmsItem = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  link: string;
  imageUrl?: string | import("astro").ImageMetadata;
  imageAlt?: string;
  imageWidth?: number;
  imageHeight?: number;
  imageSrcSet?: string;
};

export type WpEvent = WpCmsItem & {
  eventDate?: string;
  eventLocation?: string;
  ctaLabel: string;
};

export type WpArticle = WpCmsItem & {
  category?: string;
  categories?: { name: string; slug: string }[];
};

export type WpEventDetail = WpEvent & {
  contentHtml: string;
};

export type WpArticleDetail = WpArticle & {
  contentHtml: string;
};

type WpRendered = {
  rendered?: string;
};

type WpFeaturedMedia = {
  source_url?: string;
  alt_text?: string;
  media_details?: {
    width?: number;
    height?: number;
    sizes?: Record<string, { source_url?: string; width?: number; height?: number }>;
  };
};

type WpTerm = {
  id: number;
  name: string;
  slug: string;
  taxonomy?: string;
};

type WpPost = {
  id: number;
  slug?: string;
  date?: string;
  link?: string;
  title?: WpRendered;
  excerpt?: WpRendered;
  content?: WpRendered;
  meta?: Record<string, unknown>;
  _embedded?: {
    "wp:featuredmedia"?: WpFeaturedMedia[];
    "wp:term"?: WpTerm[][];
  };
};

const DEFAULT_WP_API_URL = "http://localhost:8080/wp-json";
const MAX_WP_PER_PAGE = 100;

const wpApiUrl = (import.meta.env.WP_API_URL || DEFAULT_WP_API_URL).replace(/\/$/, "");
const debugWp = import.meta.env.WP_DEBUG_FETCH === "true";

export function cmsEventPath(slug: string): string {
  return `/wydarzenia/${slug}`;
}

export function cmsArticlePath(slug: string): string {
  return `/artykuly/${slug}`;
}

function decodeHtml(value: string): string {
  return value
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCharCode(Number.parseInt(code, 16)))
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#039;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&rdquo;/g, "\"")
    .replace(/&ldquo;/g, "\"")
    .replace(/&ndash;/g, "-")
    .replace(/&mdash;/g, "-")
    .replace(/&hellip;/g, "...");
}

function toPlainText(html = ""): string {
  return decodeHtml(html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim());
}

/** Trusted CMS HTML — usuwa skrypty i atrybuty on*. */
export function sanitizeWpHtml(html = ""): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
}

function textMeta(meta: Record<string, unknown> | undefined, key: string): string | undefined {
  const value = meta?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function featuredImage(
  post: WpPost,
  variant: "list" | "detail" = "list",
): Pick<WpCmsItem, "imageUrl" | "imageAlt" | "imageWidth" | "imageHeight" | "imageSrcSet"> {
  const media = post._embedded?.["wp:featuredmedia"]?.[0];
  const sizes = media?.media_details?.sizes;
  const fullWidth = media?.media_details?.width;
  const fullHeight = media?.media_details?.height;

  const pickSize = (...keys: string[]) => {
    for (const key of keys) {
      const candidate = sizes?.[key];
      if (candidate?.source_url) return candidate;
    }
    return undefined;
  };

  const chosen =
    variant === "list"
      ? pickSize("medium_large", "medium", "large") ?? (media?.source_url ? { source_url: media.source_url, width: fullWidth, height: fullHeight } : undefined)
      : pickSize("large", "medium_large", "full") ?? (media?.source_url ? { source_url: media.source_url, width: fullWidth, height: fullHeight } : undefined);

  const srcSetParts: string[] = [];
  for (const key of ["thumbnail", "medium", "medium_large", "large"]) {
    const size = sizes?.[key];
    if (size?.source_url && size.width) {
      srcSetParts.push(`${size.source_url} ${size.width}w`);
    }
  }

  return {
    imageUrl: chosen?.source_url || media?.source_url,
    imageAlt: media?.alt_text ? toPlainText(media.alt_text) : undefined,
    imageWidth: chosen?.width || fullWidth,
    imageHeight: chosen?.height || fullHeight,
    imageSrcSet: srcSetParts.length > 1 ? srcSetParts.join(", ") : undefined,
  };
}

function baseItem(post: WpPost, type: "gdd_event" | "gdd_article"): WpCmsItem {
  const slug = post.slug || String(post.id);
  const link = type === "gdd_event" ? cmsEventPath(slug) : cmsArticlePath(slug);

  return {
    id: post.id,
    slug,
    title: toPlainText(post.title?.rendered || "Bez tytułu"),
    excerpt: toPlainText(post.excerpt?.rendered || ""),
    date: post.date || "",
    link,
    ...featuredImage(post),
  };
}

function mapEvent(post: WpPost): WpEvent {
  return {
    ...baseItem(post, "gdd_event"),
    eventDate: textMeta(post.meta, "event_date"),
    eventLocation: textMeta(post.meta, "event_location"),
    ctaLabel: textMeta(post.meta, "event_cta_label") || "Czytaj więcej",
  };
}

function articleCategoriesFromPost(post: WpPost): { name: string; slug: string }[] {
  const flatTerms = (post._embedded?.["wp:term"] ?? []).flat();
  const taxonomyTerms = flatTerms.filter((term) => term.taxonomy === "gdd_article_category");

  if (taxonomyTerms.length) {
    return taxonomyTerms.map((term) => ({
      name: toPlainText(term.name),
      slug: term.slug,
    }));
  }

  const legacyCategory = textMeta(post.meta, "article_category");
  if (legacyCategory) {
    return [{ name: legacyCategory, slug: slugifyCategory(legacyCategory) }];
  }

  return [];
}

function mapArticle(post: WpPost): WpArticle {
  const categories = articleCategoriesFromPost(post);

  return {
    ...baseItem(post, "gdd_article"),
    categories,
    category: categories[0]?.name,
  };
}

async function fetchWpJson<T>(url: URL): Promise<T | null> {
  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      if (debugWp) {
        console.warn(`WordPress REST returned ${response.status} for ${url.pathname}`);
      }
      return null;
    }

    return (await response.json()) as T;
  } catch (error) {
    if (debugWp) {
      console.warn(`WordPress REST unavailable for ${url.pathname}:`, error);
    }
    return null;
  }
}

async function fetchWpPosts(type: "gdd_event" | "gdd_article", limit: number): Promise<WpPost[]> {
  const endpoint = new URL(`${wpApiUrl}/wp/v2/${type}`);
  endpoint.searchParams.set(
    "_embed",
    type === "gdd_article" ? "wp:featuredmedia,wp:term" : "wp:featuredmedia",
  );
  endpoint.searchParams.set("per_page", String(Math.min(Math.max(limit, 1), MAX_WP_PER_PAGE)));
  endpoint.searchParams.set("orderby", "date");
  endpoint.searchParams.set("order", "desc");
  endpoint.searchParams.set("status", "publish");

  const posts = await fetchWpJson<unknown>(endpoint);
  return Array.isArray(posts) ? (posts as WpPost[]) : [];
}

async function fetchWpPostBySlug(
  type: "gdd_event" | "gdd_article",
  slug: string,
): Promise<WpPost | null> {
  const endpoint = new URL(`${wpApiUrl}/wp/v2/${type}`);
  endpoint.searchParams.set("slug", slug);
  endpoint.searchParams.set(
    "_embed",
    type === "gdd_article" ? "wp:featuredmedia,wp:term" : "wp:featuredmedia",
  );
  endpoint.searchParams.set("status", "publish");

  const posts = await fetchWpJson<WpPost[]>(endpoint);
  return posts?.[0] ?? null;
}

export async function getWpEvents({ limit = 3 }: { limit?: number } = {}): Promise<WpEvent[]> {
  const posts = await fetchWpPosts("gdd_event", limit);

  return posts
    .map(mapEvent)
    .sort((a, b) => {
      const aTime = Date.parse(a.eventDate || a.date || "");
      const bTime = Date.parse(b.eventDate || b.date || "");
      return (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime);
    })
    .slice(0, limit);
}

export async function getAllWpEvents(): Promise<WpEvent[]> {
  return getWpEvents({ limit: MAX_WP_PER_PAGE });
}

export async function getWpEventBySlug(slug: string): Promise<WpEventDetail | null> {
  const post = await fetchWpPostBySlug("gdd_event", slug);
  if (!post) return null;

  return {
    ...mapEvent(post),
    ...featuredImage(post, "detail"),
    contentHtml: sanitizeWpHtml(post.content?.rendered || ""),
  };
}

export async function getWpArticles({ limit = 3 }: { limit?: number } = {}): Promise<WpArticle[]> {
  const posts = await fetchWpPosts("gdd_article", limit);
  return posts.map(mapArticle).slice(0, limit);
}

export async function getAllWpArticles(): Promise<WpArticle[]> {
  return getWpArticles({ limit: MAX_WP_PER_PAGE });
}

export async function getWpArticleBySlug(slug: string): Promise<WpArticleDetail | null> {
  const post = await fetchWpPostBySlug("gdd_article", slug);
  if (!post) return null;

  return {
    ...mapArticle(post),
    ...featuredImage(post, "detail"),
    contentHtml: sanitizeWpHtml(post.content?.rendered || ""),
  };
}

export async function getRelatedWpArticles(current: WpArticle, limit = 2): Promise<WpArticle[]> {
  const endpoint = new URL(`${wpApiUrl}/wp/v2/gdd_article`);
  endpoint.searchParams.set("_embed", "wp:featuredmedia,wp:term");
  endpoint.searchParams.set("per_page", "20");
  endpoint.searchParams.set("orderby", "date");
  endpoint.searchParams.set("order", "desc");
  endpoint.searchParams.set("status", "publish");

  const posts = await fetchWpJson<WpPost[]>(endpoint);
  if (!posts?.length) return [];

  const articles = posts.map(mapArticle).filter((item) => item.slug !== current.slug);
  return pickRelatedArticles(articles, current, limit);
}

export async function getRelatedWpEvents(excludeSlug: string, limit = 2): Promise<WpEvent[]> {
  const posts = await fetchWpPosts("gdd_event", 20);
  const events = posts
    .map(mapEvent)
    .sort((a, b) => {
      const aTime = Date.parse(a.eventDate || a.date || "");
      const bTime = Date.parse(b.eventDate || b.date || "");
      return (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime);
    });

  const current = events.find((item) => item.slug === excludeSlug);
  if (!current) {
    return events.filter((item) => item.slug !== excludeSlug).slice(0, limit);
  }

  return pickRelatedEvents(events, current, limit);
}
