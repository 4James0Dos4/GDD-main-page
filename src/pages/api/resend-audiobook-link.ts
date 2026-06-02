import type { APIRoute } from "astro";
import { issueDownloadLinkAndEmail } from "../../lib/fulfillment";
import { getStripe } from "../../lib/stripe";
import { isStripeSecretKeyConfigured } from "../../lib/stripeEnv";

export const prerender = false;

function normalizeEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().toLowerCase();
  if (!trimmed || !trimmed.includes("@")) return null;
  return trimmed;
}

export const POST: APIRoute = async ({ request }) => {
  if (!isStripeSecretKeyConfigured()) {
    return new Response(JSON.stringify({ error: "Sklep jest tymczasowo niedostępny." }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: { email?: string; sessionId?: string };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Nieprawidłowe żądanie." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const email = normalizeEmail(body.email);
  const sessionId = typeof body.sessionId === "string" ? body.sessionId.trim() : "";

  if (!email || !sessionId || !sessionId.startsWith("cs_")) {
    return new Response(
      JSON.stringify({ error: "Podaj adres e-mail i identyfikator sesji z płatności." }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return new Response(
        JSON.stringify({ error: "Nie znaleźliśmy opłaconego zamówienia dla podanych danych." }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }

    const sessionEmail = (
      session.customer_details?.email ||
      session.customer_email ||
      session.metadata?.customer_email ||
      ""
    )
      .trim()
      .toLowerCase();

    if (!sessionEmail || sessionEmail !== email) {
      return new Response(
        JSON.stringify({ error: "Nie znaleźliśmy opłaconego zamówienia dla podanych danych." }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }

    const productId = session.metadata?.product_id;
    if (!productId) {
      return new Response(JSON.stringify({ error: "Brak produktu w zamówieniu." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const result = await issueDownloadLinkAndEmail({
      sessionId,
      productId,
      email,
      request,
    });

    if (!result.ok || !result.emailSent) {
      console.error("[resend-link]", result.reason || result.emailError);
      return new Response(
        JSON.stringify({
          error:
            "Nie udało się wysłać linku. Sprawdź konfigurację sklepu lub napisz do nas przez stopkę strony.",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[resend-link]", error);
    return new Response(JSON.stringify({ error: "Nie udało się przetworzyć żądania." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
