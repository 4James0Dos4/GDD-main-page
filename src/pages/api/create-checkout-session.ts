import type { APIRoute } from "astro";
import { getAudiobookById, resolveStripePriceId } from "../../data/audiobooks";
import { getStripe } from "../../lib/stripe";
import { getSiteOrigin, isStripeSecretKeyConfigured } from "../../lib/stripeEnv";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = (await request.json()) as { productId?: string };
    const productId = body.productId?.trim();

    if (!productId) {
      return new Response(JSON.stringify({ error: "Brak productId." }), { status: 400 });
    }

    const product = getAudiobookById(productId);
    if (!product) {
      return new Response(JSON.stringify({ error: "Nieznany produkt." }), { status: 404 });
    }

    if (!isStripeSecretKeyConfigured()) {
      return new Response(
        JSON.stringify({
          error:
            "Skonfiguruj STRIPE_SECRET_KEY w pliku .env (Dashboard → Developers → API keys, tryb Test).",
        }),
        { status: 503 },
      );
    }

    const priceId = resolveStripePriceId(product);
    if (!priceId || priceId.includes("REPLACE_ME")) {
      return new Response(
        JSON.stringify({ error: "Skonfiguruj Stripe Price ID w pliku .env." }),
        { status: 503 },
      );
    }

    const origin = getSiteOrigin(request);
    const stripe = getStripe();

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/sukces?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/anulowano`,
      customer_creation: "always",
      billing_address_collection: "auto",
      metadata: {
        product_id: product.id,
      },
      payment_intent_data: {
        metadata: {
          product_id: product.id,
        },
      },
    });

    if (!session.url) {
      return new Response(JSON.stringify({ error: "Nie udało się utworzyć sesji Stripe." }), {
        status: 500,
      });
    }

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[checkout]", error);
    return new Response(JSON.stringify({ error: "Błąd tworzenia płatności." }), { status: 500 });
  }
};
