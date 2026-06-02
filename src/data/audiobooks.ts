export type AudiobookProduct = {
  id: string;
  title: string;
  author: string;
  description: string;
  duration: string;
  priceLabel: string;
  /** Klucz zmiennej środowiskowej ze Stripe Price ID */
  stripePriceEnvKey: string;
  fileName: string;
  coverAlt: string;
};

export const audiobooks: AudiobookProduct[] = [
  {
    id: "wprowadzenie-dzwieku",
    title: "Wprowadzenie do pięknego dźwięku",
    author: "Fundacja Gospoda Dobrego Dźwięku",
    description:
      "Krótki audiobook wprowadzający w świat realizacji dźwięku, edukacji muzycznej i pracy twórczej — idealny na start.",
    duration: "ok. 45 min",
    priceLabel: "29,00 zł",
    stripePriceEnvKey: "STRIPE_PRICE_WPROWADZENIE_DZWIEKU",
    fileName: "wprowadzenie-dzwieku.mp3",
    coverAlt: "Okładka audiobooka Wprowadzenie do pięknego dźwięku",
  },
];

export function getAudiobookById(id: string): AudiobookProduct | undefined {
  return audiobooks.find((book) => book.id === id);
}

export function resolveStripePriceId(product: AudiobookProduct): string | undefined {
  const fromEnv = import.meta.env[product.stripePriceEnvKey as keyof ImportMetaEnv];
  return typeof fromEnv === "string" && fromEnv.trim() ? fromEnv.trim() : undefined;
}
