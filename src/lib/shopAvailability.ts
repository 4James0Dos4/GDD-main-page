import { access } from "node:fs/promises";
import path from "node:path";
import type { AudiobookProduct } from "../data/audiobooks";
import { isStripeSecretKeyConfigured, getStripeWebhookSecret } from "./stripeEnv";
import { isResendConfigured } from "./email";

export async function canPurchase(product: AudiobookProduct): Promise<boolean> {
  const webhook = getStripeWebhookSecret();
  const sender = process.env.EMAIL_FROM || import.meta.env.EMAIL_FROM || "";
  if (!isStripeSecretKeyConfigured() || !webhook || webhook.includes("REPLACE_ME") ||
      !isResendConfigured() || !sender || sender.includes("resend.dev")) return false;
  try {
    await access(path.join(process.cwd(), "private", "audiobooks", product.fileName));
    return true;
  } catch { return false; }
}
