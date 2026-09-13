export function getStripeSecretKey(): string | undefined {
  return (process.env.STRIPE_SECRET_KEY ?? import.meta.env.STRIPE_SECRET_KEY)?.trim() || undefined;
}

/** Prawdziwy klucz z Dashboard — odrzuca puste wartości i placeholdery z .env.example */
export function isStripeSecretKeyConfigured(): boolean {
  const key = getStripeSecretKey();
  return !!key && !key.includes("REPLACE_ME");
}

export function getStripeWebhookSecret(): string | undefined {
  return (process.env.STRIPE_WEBHOOK_SECRET ?? import.meta.env.STRIPE_WEBHOOK_SECRET)?.trim() || undefined;
}

export function getSiteOrigin(request?: Request): string {
  const fromEnv = (process.env.PUBLIC_SITE_URL ?? import.meta.env.PUBLIC_SITE_URL)?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  if (request) {
    const url = new URL(request.url);
    return url.origin;
  }
  return "https://gospodadobregodzwieku.pl";
}

export function getDownloadTokenTtlHours(): number {
  const hours = Number(import.meta.env.DOWNLOAD_TOKEN_TTL_HOURS || "72");
  return Math.max(1, hours);
}

export function getDownloadTokenTtlMs(): number {
  return getDownloadTokenTtlHours() * 60 * 60 * 1000;
}
