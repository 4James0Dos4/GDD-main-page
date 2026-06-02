import Stripe from "stripe";
import { getStripeSecretKey } from "./stripeEnv";

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  const key = getStripeSecretKey();
  if (!key) {
    throw new Error("Brak STRIPE_SECRET_KEY w zmiennych środowiskowych.");
  }
  if (!stripeClient) {
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}
