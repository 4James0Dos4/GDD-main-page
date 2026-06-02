/**
 * Szacuje czas czytania na podstawie HTML z CMS (ok. 200 słów/min).
 */
export function estimateReadingMinutes(html: string): number {
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  if (!text) return 1;
  const words = text.split(" ").filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export function formatArticleDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";

  return new Intl.DateTimeFormat("pl-PL", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(parsed);
}

const PL_CHAR_MAP: Record<string, string> = {
  ą: "a",
  ć: "c",
  ę: "e",
  ł: "l",
  ń: "n",
  ó: "o",
  ś: "s",
  ź: "z",
  ż: "z",
};

/** Slug kategorii artykułu — do filtrowania jak na mana.org.pl/blog */
export function slugifyCategory(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .split("")
    .map((ch) => PL_CHAR_MAP[ch] ?? ch)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function articleCategoryDataAttr(category?: string): string {
  if (!category?.trim()) return "";
  return slugifyCategory(category);
}

export function collectArticleCategories(
  articles: { categories?: { name: string; slug: string }[]; category?: string }[],
): { label: string; slug: string }[] {
  const seen = new Map<string, string>();

  for (const article of articles) {
    if (article.categories?.length) {
      for (const cat of article.categories) {
        if (cat.slug && !seen.has(cat.slug)) {
          seen.set(cat.slug, cat.name);
        }
      }
      continue;
    }

    const label = article.category?.trim();
    if (!label) continue;

    const slug = slugifyCategory(label);
    if (slug && !seen.has(slug)) {
      seen.set(slug, label);
    }
  }

  return [...seen.entries()]
    .map(([slug, label]) => ({ slug, label }))
    .sort((a, b) => a.label.localeCompare(b.label, "pl"));
}

export function articleCategorySlugsAttr(article: {
  categories?: { slug: string }[];
  category?: string;
}): string {
  if (article.categories?.length) {
    return article.categories.map((cat) => cat.slug).join(" ");
  }

  return articleCategoryDataAttr(article.category);
}

export function truncateExcerpt(text: string, maxLength = 320): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength).trimEnd()}…`;
}

export function pickRelatedArticles(
  all: { slug: string; categories?: { slug: string }[]; category?: string; date?: string }[],
  current: { slug: string; categories?: { slug: string }[]; category?: string },
  limit: number,
): typeof all {
  const others = all.filter((item) => item.slug !== current.slug);
  const currentSlugs = new Set<string>();

  if (current.categories?.length) {
    for (const cat of current.categories) {
      if (cat.slug) currentSlugs.add(cat.slug);
    }
  } else if (current.category) {
    currentSlugs.add(slugifyCategory(current.category));
  }

  const withShared: typeof all = [];
  const without: typeof all = [];

  for (const item of others) {
    const itemSlugs = item.categories?.length
      ? item.categories.map((cat) => cat.slug).filter(Boolean)
      : item.category
        ? [slugifyCategory(item.category)]
        : [];

    const sharesCategory = itemSlugs.some((slug) => currentSlugs.has(slug));
    if (sharesCategory && currentSlugs.size) {
      withShared.push(item);
    } else {
      without.push(item);
    }
  }

  return [...withShared, ...without].slice(0, limit);
}
