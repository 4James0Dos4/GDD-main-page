/** Narzędzia do czytelnego formatowania treści (pogrubienia, etykiety). */

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** **tekst** → <strong>tekst</strong> (po escapowaniu). */
export function formatSimpleBold(text: string): string {
  return escapeHtml(text).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

/** „Etykieta – opis” lub „Etykieta - opis” → pogrubiona etykieta. */
export function formatLeadDash(text: string): string {
  const match = text.match(/^(.+?)\s[–—-]\s(.+)$/);
  if (!match) return escapeHtml(text);
  return `<strong>${escapeHtml(match[1])}</strong> — ${escapeHtml(match[2])}`;
}

/** „Etykieta: wartość” → pogrubiona etykieta. */
export function formatLabelColon(text: string): string {
  const idx = text.indexOf(":");
  if (idx <= 0 || idx > 48) return escapeHtml(text);
  const label = text.slice(0, idx + 1);
  const rest = text.slice(idx + 1);
  return `<strong>${escapeHtml(label)}</strong>${escapeHtml(rest)}`;
}

/** Pogrubia „Każdy/Każda …” na początku zdania (lista wskazówek). */
export function formatEachSubject(text: string): string {
  const match = text.match(/^(Każd[aey]\s+\S+)/i);
  if (!match) return escapeHtml(text);
  return `<strong>${escapeHtml(match[1])}</strong>${escapeHtml(text.slice(match[1].length))}`;
}

/** Etykiety rejestrowe, PKD i podobne w dokumentach prawnych. */
export function formatDocumentInline(text: string): string {
  return text
    .replace(
      /^(RODZAJ ORGANIZACJI|KRS|NIP|REGON|NUMER KONTA BANKOWEGO|E-MAIL|TELEFON|PKD):/gm,
      "<strong>$1:</strong>",
    )
    .replace(/\(PKD:\s[\d.]+Z\)/g, "<strong>$&</strong>")
    .replace(/^nr:/gm, "<strong>nr:</strong>");
}

/** Cecha pakietu mix/mastering z czytelną etykietą. */
export function formatMixPackageFeature(
  field: "revisions" | "delivery" | "turnaround" | "output",
  value: string,
): string {
  switch (field) {
    case "turnaround":
      return formatLabelColon(value);
    case "revisions":
      return `<strong>Poprawki:</strong> ${escapeHtml(value)}`;
    case "delivery":
      return `<strong>${escapeHtml(value)}</strong>`;
    case "output": {
      const match = value.match(/^(Plik wynikowy)/i);
      if (!match) return escapeHtml(value);
      return `<strong>${escapeHtml(match[1])}</strong>${escapeHtml(value.slice(match[1].length))}`;
    }
    default:
      return escapeHtml(value);
  }
}
