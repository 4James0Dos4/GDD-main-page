import { escapeHtml, formatDocumentInline } from "./formatReadable";

export interface DocumentSection {
  id: string;
  number: string;
  title: string;
  body: string;
}

function formatListItemContent(text: string): string {
  return formatDocumentInline(escapeHtml(text));
}

function formatParagraphContent(text: string): string {
  return formatDocumentInline(escapeHtml(text).replace(/\n/g, "<br>"));
}

/** Zamienia surowy tekst dokumentu na HTML (akapity + nagłówki §). */
export function documentTextToHtml(text: string): string {
  const blocks = text.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);

  return blocks
    .map((block) => {
      const lines = block.split("\n");
      const first = lines[0]?.trim() ?? "";

      if (/^§\s*\d+/.test(first)) {
        const rest = lines.slice(1).join("\n").trim();
        const heading = `<h3 class="mana-docs-prose__heading">${escapeHtml(first)}</h3>`;
        if (!rest) return heading;
        return `${heading}<p>${formatParagraphContent(rest)}</p>`;
      }

      if (/^[IVXLC]+\.\s/.test(first) && lines.length === 1) {
        return `<h3 class="mana-docs-prose__heading mana-docs-prose__heading--roman">${escapeHtml(first)}</h3>`;
      }

      if (/^\d+\.\s/.test(first) && lines.every((line) => /^\d+\.\s/.test(line.trim()))) {
        const items = lines
          .map((line) => line.trim())
          .filter(Boolean)
          .map((line) => `<li>${formatListItemContent(line.replace(/^\d+\.\s*/, ""))}</li>`)
          .join("");
        return `<ol class="mana-docs-prose__list">${items}</ol>`;
      }

      return `<p>${formatParagraphContent(block)}</p>`;
    })
    .join("");
}
