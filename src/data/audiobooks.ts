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
  amount?: number;
  mimeType?: string;
  cover?: string;
};

const legacyAudiobooks: AudiobookProduct[] = [
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

export const audiobooks: AudiobookProduct[] = [{
  id: "instrumentalne-abc",
  title: "Instrumentalne ABC",
  author: "Aneta Laura Prochot",
  description: "Przewodnik po instrumentach, ich budowie i brzmieniu, z przykładami ustawienia mikrofonów. Dla uczniów, muzyków i osób rozpoczynających przygodę z realizacją nagrań. Autorska publikacja edukacyjna, Warszawa 2026.",
  duration: "PDF · 137 stron · 144 MB",
  priceLabel: "40,00 zł",
  amount: 4000,
  stripePriceEnvKey: "",
  fileName: "instrumentalne-abc.pdf",
  mimeType: "application/pdf",
  cover: "/instrumentalne-abc-cover.jpg",
  coverAlt: "Instrumentalne ABC — Aneta Laura Prochot",
}];

export function getAudiobookById(id: string): AudiobookProduct | undefined {
  return [...audiobooks, ...legacyAudiobooks].find((book) => book.id === id);
}

export function resolveStripePriceId(product: AudiobookProduct): string | undefined {
  const fromEnv = import.meta.env[product.stripePriceEnvKey as keyof ImportMetaEnv];
  return typeof fromEnv === "string" && fromEnv.trim() ? fromEnv.trim() : undefined;
}
