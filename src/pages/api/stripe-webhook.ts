import type { APIRoute } from "astro";
import { fulfillCheckoutSession } from "../../lib/fulfillment";
import { getStripe } from "../../lib/stripe";
import { getStripeWebhookSecret } from "../../lib/stripeEnv";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const webhookSecret = getStripeWebhookSecret();
  if (!webhookSecret) {
    return new Response("Brak STRIPE_WEBHOOK_SECRET.", { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Brak nagłówka stripe-signature.", { status: 400 });
  }

  const rawBody = await request.text();

  let event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    console.error("[webhook:verify]", error);
    return new Response("Nieprawidłowy podpis webhooka.", { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const result = await fulfillCheckoutSession(session, request);
    if (!result.ok) {
      console.error("[webhook:fulfill]", result.reason);
      return new Response(result.reason || "Fulfillment failed.", { status: 500 });
    }
    if (!result.emailSent) {
      console.error("[webhook:fulfill:email]", result.emailError);
      return new Response(result.emailError || "Email delivery failed.", { status: 500 });
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
