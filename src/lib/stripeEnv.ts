export function getStripeSecretKey(): string | undefined {
  return import.meta.env.STRIPE_SECRET_KEY?.trim() || undefined;
}

/** Prawdziwy klucz z Dashboard — odrzuca puste wartości i placeholdery z .env.example */
export function isStripeSecretKeyConfigured(): boolean {
  const key = getStripeSecretKey();
  return !!key && !key.includes("REPLACE_ME");
}

export function getStripeWebhookSecret(): string | undefined {
  return import.meta.env.STRIPE_WEBHOOK_SECRET?.trim() || undefined;
}

export function getSiteOrigin(request?: Request): string {
  const fromEnv = import.meta.env.PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  if (request) {
    const url = new URL(request.url);
    return url.origin;
  }
  return "http://localhost:4321";
}

export function getDownloadTokenTtlHours(): number {
  const hours = Number(import.meta.env.DOWNLOAD_TOKEN_TTL_HOURS || "72");
  return Math.max(1, hours);
}

export function getDownloadTokenTtlMs(): number {
  return getDownloadTokenTtlHours() * 60 * 60 * 1000;
}
