/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly WP_API_URL?: string;
  readonly WP_DEBUG_FETCH?: string;
  readonly PUBLIC_WP_SITE_URL?: string;
  readonly PUBLIC_SITE_URL?: string;
  readonly STRIPE_SECRET_KEY?: string;
  readonly STRIPE_WEBHOOK_SECRET?: string;
  readonly RESEND_API_KEY?: string;
  readonly EMAIL_FROM?: string;
  readonly DOWNLOAD_TOKEN_TTL_HOURS?: string;
  readonly STRIPE_PRICE_WPROWADZENIE_DZWIEKU?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
