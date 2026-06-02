type WpEventLike = {
  slug: string;
  date?: string;
  eventDate?: string;
};

export function formatEventBadge(value?: string): { month: string; day: string } {
  if (!value) return { month: "—", day: "" };

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return { month: "—", day: value.slice(0, 2) };
  }

  const month = new Intl.DateTimeFormat("pl-PL", { month: "short" })
    .format(parsed)
    .replace(/\.$/, "")
    .toUpperCase();
  const day = new Intl.DateTimeFormat("pl-PL", { day: "2-digit" }).format(parsed);

  return { month, day };
}

export function formatEventMetaLine(eventDate?: string, location?: string, fallbackDate?: string): string {
  const raw = eventDate || fallbackDate;
  if (!raw && !location) return "";

  let datePart = raw || "";
  if (raw) {
    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) {
      datePart = new Intl.DateTimeFormat("pl-PL", {
        day: "numeric",
        month: "numeric",
        year: "numeric",
      }).format(parsed);
    }
  }

  return [datePart, location].filter(Boolean).join(", ");
}

export function eventFilterSlug(date?: string): "upcoming" | "past" {
  if (!date) return "past";

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "past";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  parsed.setHours(0, 0, 0, 0);

  return parsed >= today ? "upcoming" : "past";
}

export function eventFilterAttr(date?: string): string {
  const slug = eventFilterSlug(date);
  return `all ${slug}`;
}

export function pickRelatedEvents(all: WpEventLike[], current: WpEventLike, limit: number): WpEventLike[] {
  const others = all.filter((item) => item.slug !== current.slug);
  const currentTime = Date.parse(current.eventDate || current.date || "");

  return others
    .sort((a, b) => {
      const aTime = Date.parse(a.eventDate || a.date || "");
      const bTime = Date.parse(b.eventDate || b.date || "");

      if (!Number.isNaN(currentTime) && !Number.isNaN(aTime) && !Number.isNaN(bTime)) {
        return Math.abs(aTime - currentTime) - Math.abs(bTime - currentTime);
      }

      return (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime);
    })
    .slice(0, limit);
}
