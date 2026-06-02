import path from "node:path";
import { access } from "node:fs/promises";
import type Stripe from "stripe";
import { getAudiobookById } from "../data/audiobooks";
import {
  clearPlainTokenBySessionId,
  createDownloadToken,
  deleteTokenBySessionId,
  findTokenBySessionId,
  isTokenUsable,
} from "./downloadTokens";
import { isResendConfigured, sendAudiobookDeliveryEmail } from "./email";
import { getSiteOrigin } from "./stripeEnv";

export type FulfillmentResult = {
  ok: boolean;
  reason?: string;
  skipped?: boolean;
  emailSent?: boolean;
  emailError?: string;
};

async function deliverByEmail(
  email: string,
  product: NonNullable<ReturnType<typeof getAudiobookById>>,
  downloadUrl: string,
  sessionId: string,
): Promise<{ emailSent: boolean; emailError?: string }> {
  const mail = await sendAudiobookDeliveryEmail({
    to: email,
    product,
    downloadUrl,
  });

  if (mail.ok) {
    await clearPlainTokenBySessionId(sessionId);
    return { emailSent: true };
  }

  return {
    emailSent: false,
    emailError: mail.error || "Nie udało się wysłać e-maila z linkiem do pobrania.",
  };
}

async function assertAudiobookFile(product: NonNullable<ReturnType<typeof getAudiobookById>>) {
  const filePath = path.join(process.cwd(), "private", "audiobooks", product.fileName);
  try {
    await access(filePath);
  } catch {
    throw new Error(`Brak pliku audiobooka: ${product.fileName}`);
  }
}

/** Tworzy nowy token i wysyła mail (np. ponowna wysyłka lub pierwsza dostawa). */
export async function issueDownloadLinkAndEmail(input: {
  sessionId: string;
  productId: string;
  email: string;
  request?: Request;
}): Promise<FulfillmentResult> {
  const product = getAudiobookById(input.productId);
  if (!product) {
    return { ok: false, reason: `Nieznany produkt: ${input.productId}` };
  }

  try {
    await assertAudiobookFile(product);
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error ? error.message : "Brak pliku audiobooka.",
    };
  }

  if (!isResendConfigured()) {
    return {
      ok: false,
      reason: "Skonfiguruj RESEND_API_KEY w pliku .env.",
      emailSent: false,
      emailError: "Skonfiguruj RESEND_API_KEY w pliku .env.",
    };
  }

  await deleteTokenBySessionId(input.sessionId);

  const origin = getSiteOrigin(input.request);
  let plainToken: string;
  try {
    plainToken = await createDownloadToken({
      productId: product.id,
      email: input.email,
      sessionId: input.sessionId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nie udało się utworzyć tokenu.";
    return { ok: false, reason: message };
  }

  const downloadUrl = `${origin}/api/download/${plainToken}`;
  const delivery = await deliverByEmail(input.email, product, downloadUrl, input.sessionId);

  if (!delivery.emailSent) {
    return {
      ok: false,
      reason: delivery.emailError,
      emailSent: false,
      emailError: delivery.emailError,
    };
  }

  return { ok: true, emailSent: true };
}

export async function fulfillCheckoutSession(
  session: Stripe.Checkout.Session,
  request?: Request,
): Promise<FulfillmentResult> {
  if (session.payment_status !== "paid") {
    return {
      ok: false,
      reason: `Sesja ${session.id} nie jest opłacona (status: ${session.payment_status}).`,
    };
  }

  const origin = getSiteOrigin(request);
  const existing = await findTokenBySessionId(session.id);

  if (existing?.plainToken && isTokenUsable(existing)) {
    const product = getAudiobookById(existing.productId);
    if (!product) {
      return { ok: false, reason: `Nieznany produkt: ${existing.productId}` };
    }

    const downloadUrl = `${origin}/api/download/${existing.plainToken}`;
    const delivery = await deliverByEmail(existing.email, product, downloadUrl, session.id);

    return {
      ok: delivery.emailSent,
      skipped: true,
      emailSent: delivery.emailSent,
      emailError: delivery.emailError,
      reason: delivery.emailSent ? undefined : delivery.emailError,
    };
  }

  if (existing && isTokenUsable(existing) && !existing.plainToken) {
    return { ok: true, skipped: true, emailSent: true };
  }

  if (existing) {
    await deleteTokenBySessionId(session.id);
  }

  const productId = session.metadata?.product_id;
  const email =
    session.customer_details?.email ||
    session.customer_email ||
    session.metadata?.customer_email;

  if (!productId || !email) {
    return { ok: false, reason: "Brak product_id lub adresu e-mail w sesji Stripe." };
  }

  return issueDownloadLinkAndEmail({
    sessionId: session.id,
    productId,
    email,
    request,
  });
}
