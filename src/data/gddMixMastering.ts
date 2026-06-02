export type MixMasteringPackage = {
  tracksLabel: string;
  price: string;
  revisions: string;
  delivery: string;
  turnaround: string;
  output: string;
  featured?: boolean;
};

export const mixMasteringPage = {
  heroTitle: "MIX & MASTERING",
  heroSubtitle: "Nadaj Swojej Muzyce Profesjonalne Brzmienie!",
  serviceLabel: "Usługa mix - mastering",

  introHeading: "Co zyskasz dzięki naszej pracy?",
  introParagraphs: [
    "Każdy utwór muzyczny, tuż po procesie nagrania wymaga jeszcze obróbki technicznej. Dzięki temu może brzmieć czysto, czytelnie, przejrzyście, przestronnie i w wyrównanych proporcjach brzmieniowych.",
    "Zabiegi, które wykonamy dla Ciebie sprawią, że **Twoje nagranie będzie brzmieć profesjonalnie!**",
    "**Do najczęstszych zabiegów nad nagraniem należą:** ustalenie odpowiednich proporcji głośności poszczególnych ścieżek miksu, osadzenie w panoramie, korekcja, kompresja, poszerzenie bazy stereo oraz dobranie takich efektów brzmieniowych, aby nagranie brzmiało spójnie, nabrało głębi i wyrazistości.",
    "Wyróżnia nas **gruntowna wiedza muzyczna** i doświadczenie w zakresie realizacji dźwięku.",
    "Na każdym etapie pracy **konsultujemy nagranie z klientem**, by wypracować jak najlepszy efekt końcowy. Analizujemy nagranie pod względem kompozycji, celów stylistycznych zgodnych z gatunkiem muzycznym, czy epoką historyczną oraz jakością nagranych ścieżek. Narzędzia realizacyjne dobieramy z najwyższą starannością i uwagą.",
    "Zadowolenie klienta i jego zachwyt z wypracowanego nagrania jest dla nas **najlepszą nagrodą** za pracę.",
  ],

  preparationHeading: "W jaki sposób przygotować nagranie do etapu miksu i masteringu?",
  preparationTips: [
    "Każdy instrument powinien zostać nagrany syntetycznie i czysto, w odpowiednich warunkach akustycznych bez wszelkich zakłóceń, czy zniekształceń.",
    "Każda ścieżka powinna być zapisana jako plik .wav z użyciem profesjonalnego mikrofonu dobrej jakości.",
    "Każdy utwór muzyczny powinien być umieszczony w opisanym, osobnym pliku, np. Nagranie gitary.",
  ],

  packagesHeading: "Cennik",
  packages: [
    {
      tracksLabel: "Utwór muzyczny do 10 ścieżek audio",
      price: "150 zł",
      revisions: "bezpłatne 3 poprawki",
      delivery: "Realizacja online",
      turnaround: "Czas realizacji: do 7 dni roboczych*",
      output: "Plik wynikowy w dowolnym formacie, np. .wav, mp3, itp.",
      featured: true,
    },
    {
      tracksLabel: "Utwór muzyczny do 25 ścieżek audio",
      price: "180 zł",
      revisions: "bezpłatnych 5 poprawek, każda kolejna 5 zł",
      delivery: "Realizacja online",
      turnaround: "Czas realizacji: do 14 dni roboczych*",
      output: "Plik wynikowy w dowolnym formacie, np. .wav, mp3, itp.",
    },
    {
      tracksLabel: "Utwór muzyczny do 40 ścieżek audio",
      price: "250 zł",
      revisions: "bezpłatnych 10 poprawek, każda kolejna 2 zł",
      delivery: "Realizacja online",
      turnaround: "Czas realizacji: do 20 dni roboczych*",
      output: "Plik wynikowy w dowolnym formacie, np. .wav, mp3, itp.",
    },
    {
      tracksLabel: "Utwór muzyczny do 40 ścieżek audio",
      price: "50 zł",
      revisions: "bezpłatne poprawki bez limitu",
      delivery: "Realizacja online",
      turnaround: "1 dzień roboczy za każdą dodatkową ścieżkę*",
      output: "Plik wynikowy w dowolnym formacie, np. .wav, mp3, itp.",
    },
  ] satisfies MixMasteringPackage[],

  timingNote:
    "**Podany czas jest czasem orientacyjnym.** Praca nad dźwiękiem wymaga czasem dłuższej analizy, dystansu, dodatkowych konsultacji, czy innych specjalistycznych zabiegów realizacyjnych. Do każdego nagrania i klienta podchodzimy z uwagą, pasją i indywidualnością.",

  contactHeading: "Jak się z nami skontaktować?",
  contactText:
    "Wyślij do nas maila lub wypełnij kwestionariusz osobowy. Konsultacja telefoniczna w godzinach:",
  contactHours: "18:00 – 20:00 (pn–pt)",
  contactEmail: "g.d.d.biuro@gmail.com",
};
