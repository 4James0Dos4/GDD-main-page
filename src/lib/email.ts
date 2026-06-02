import { Resend } from "resend";
import type { AudiobookProduct } from "../data/audiobooks";
import { siteMeta } from "../data/gddHome";
import { getDownloadTokenTtlHours } from "./stripeEnv";

export function isResendConfigured(): boolean {
  const key = import.meta.env.RESEND_API_KEY?.trim();
  return !!key && !key.includes("REPLACE_ME");
}

function getResend(): Resend | null {
  if (!isResendConfigured()) return null;
  return new Resend(import.meta.env.RESEND_API_KEY!.trim());
}

function getFromAddress(): string {
  const configured = import.meta.env.EMAIL_FROM?.trim();
  const address =
    configured && !configured.includes("REPLACE_ME")
      ? configured
      : "onboarding@resend.dev";
  if (address.includes("<")) return address;
  return `${siteMeta.siteName} <${address}>`;
}

function formatTtlLabel(hours: number): string {
  if (hours === 1) return "1 godzinę";
  const mod10 = hours % 10;
  const mod100 = hours % 100;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `${hours} godziny`;
  }
  return `${hours} godzin`;
}

export async function sendAudiobookDeliveryEmail(input: {
  to: string;
  product: AudiobookProduct;
  downloadUrl: string;
}): Promise<{ ok: boolean; mode: "resend" | "unconfigured" | "error"; error?: string }> {
  const ttlHours = getDownloadTokenTtlHours();
  const ttlLabel = formatTtlLabel(ttlHours);

  const subject = `Twój audiobook: ${input.product.title}`;
  const text = [
    `Dziękujemy za zakup w ${siteMeta.siteName}.`,
    "",
    `Audiobook: ${input.product.title}`,
    `Autor: ${input.product.author}`,
    "",
    `Link do pobrania (ważny ${ttlLabel}, jednorazowy):`,
    input.downloadUrl,
    "",
    `Po pobraniu link przestaje działać. Nie udostępniaj go innym osobom.`,
    "",
    `W razie problemów napisz na adres: ${siteMeta.email}`,
    "",
    siteMeta.siteName,
  ].join("\n");

  const html = `
    <div style="font-family:Roboto,Arial,sans-serif;line-height:1.6;color:#1f2228;max-width:560px">
      <p>Dziękujemy za zakup w <strong>${siteMeta.siteName}</strong>.</p>
      <p><strong>${input.product.title}</strong><br>${input.product.author}</p>
      <p><a href="${input.downloadUrl}" style="display:inline-block;padding:12px 20px;background:#1f2228;color:#fff;text-decoration:none;border-radius:6px">Pobierz audiobook</a></p>
      <p style="font-size:13px;color:#454950">Link jest ważny przez <strong>${ttlLabel}</strong> i działa <strong>jednorazowo</strong>. Po pobraniu wygasa. Nie przekazuj linku dalej.</p>
      <p style="font-size:13px;color:#454950">Jeśli masz problem z pobraniem, napisz na <a href="mailto:${siteMeta.email}">${siteMeta.email}</a>.</p>
    </div>
  `;

  const resend = getResend();
  if (!resend) {
    console.error("[email:error] Brak RESEND_API_KEY — mail nie został wysłany.", {
      to: input.to,
    });
    return {
      ok: false,
      mode: "unconfigured",
      error: "Skonfiguruj RESEND_API_KEY w pliku .env.",
    };
  }

  const result = await resend.emails.send({
    from: getFromAddress(),
    to: input.to,
    subject,
    text,
    html,
  });

  if (result.error) {
    console.error("[email:error]", result.error);
    return {
      ok: false,
      mode: "error",
      error: result.error.message || "Resend odrzucił wiadomość.",
    };
  }

  console.info("[email:sent]", { to: input.to, id: result.data?.id });
  return { ok: true, mode: "resend" };
}
