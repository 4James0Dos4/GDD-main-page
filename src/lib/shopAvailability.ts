import { access } from "node:fs/promises";
import path from "node:path";
import type { AudiobookProduct } from "../data/audiobooks";
import { resolveStripePriceId } from "../data/audiobooks";
import { isStripeSecretKeyConfigured, getStripeWebhookSecret } from "./stripeEnv";

export async function canPurchase(product: AudiobookProduct): Promise<boolean> {
  const webhook = getStripeWebhookSecret();
  if (!isStripeSecretKeyConfigured() || !webhook || webhook.includes("REPLACE_ME") ||
      !resolveStripePriceId(product)) return false;
  try {
    await access(path.join(process.cwd(), "private", "audiobooks", product.fileName));
    return true;
  } catch { return false; }
}
