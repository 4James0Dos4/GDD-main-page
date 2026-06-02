/**
 * Treść strony głównej — zsynchronizowana z E:\GospodaDobregodzwieku\1 (index + homePage + siteConfig).
 */

import heroStudio from "../assets/gdd-hero-studio.jpg";
import gddLogo from "../assets/gdd-logo.png";
import gal01 from "../assets/gdd-gallery-01.jpg";
import gal02 from "../assets/gdd-gallery-02.jpg";
import gal03 from "../assets/gdd-gallery-03.jpg";
import gal04 from "../assets/gdd-gallery-04.jpg";
import gal05 from "../assets/gdd-gallery-05.jpg";
import gal06 from "../assets/gdd-gallery-06.jpg";

export const siteMeta = {
  siteName: "Gospoda Dobrego Dźwięku",
  siteSubtitle: "Fundacja artystyczna",
  siteMotto: "…bo naszą pasją jest piękny dźwięk",
  siteDescription:
    "Fundacja artystyczna Gospoda Dobrego Dźwięku — warsztaty muzyczne, realizacja dźwięku, mix i mastering, edukacja i wsparcie młodych twórców.",
  siteUrl: "https://www.xn--gospoda-dobrego-dwiku-z0c24t.pl",
  fullSiteUrl: "https://www.xn--gospoda-dobrego-dwiku-z0c24t.pl/",
  siteDomainDisplay: "gospoda-dobrego-dźwięku.pl",
  email: "G.D.D.biuro@gmail.com",
  contact: {
    phoneDisplay: "506 231 373",
    phoneTel: "+48506231373",
    joinEmail: "g.d.d.biuro@gmail.com",
  },
  bank: {
    name: "mBank",
    accountFormatted: "25 1140 2004 0000 3002 8481 8588",
    accountRaw: "25114020040000300284818588",
    transferTitle: "DAROWIZNA",
  },
  krs: "0001091538",
  nip: "5252994959",
  regon: "527938801",
  copyright: "©2026 Gospoda Dobrego Dźwięku",
  addressLine1: "ul. Długa 29, 00-238 Warszawa",
  addressLine2: "Polska",
  disclaimer:
    "Administratorem danych osobowych kompletowanych przez Serwis internetowy strony: www.gospoda-dobrego-dźwięku.pl, prowadzony przez: FUNDACJA ARTYSTYCZNA - Gospoda Dobrego Dźwięku z siedzibą w Warszawie, ul. Długa 29, 00-238 Warszawa, KRS: 0001091538, NIP: 5252994959, REGON: 527938801, adres poczty elektronicznej: G.D.D.biuro@gmail.com.",
};

export type FoundationBoardMember = {
  name: string;
  role: string;
  primary?: boolean;
};

export const foundationBoard: FoundationBoardMember[] = [
  { name: "A. Laura Prochot", role: "Prezes Fundacji", primary: true },
  { name: "Agnieszka Domańska", role: "Wiceprezes Fundacji" },
  { name: "Jan Olszewski", role: "Sekretarz Fundacji" },
];

export type NavItem = {
  label: string;
  href?: string;
  children?: { label: string; href: string; external?: boolean }[];
};

const wix = siteMeta.siteUrl;

/** Menu główne — struktura jak gospoda-dobrego-dźwięku.pl (Wix) + Audiobooki. */
export const navItems: NavItem[] = [
  { label: "Strona główna", href: "/" },
  {
    label: "Warsztaty",
    children: [
      { label: "Oferta", href: "/oferta" },
      { label: "Warsztaty Pro Tools", href: "/warsztaty-pro-tools" },
    ],
  },
  {
    label: "Usługi",
    children: [
      { label: "mix/mastering", href: "/mix-mastering" },
    ],
  },
  {
    label: "O nas",
    children: [
      { label: "Dokumenty", href: "/dokumenty" },
      { label: "Numer Konta Bankowego", href: "/numer-konta-bankowego" },
      { label: "Dołącz do nas", href: "/dolacz-do-nas" },
      { label: "Zarząd fundacji", href: "/zarzad-fundacji" },
      { label: "Blog", href: "/artykuly" },
    ],
  },
  { label: "Audiobooki", href: "/audiobooki" },
];

/** Spłaszczone linki — stopka, skróty mobilne. */
export function flattenNavItems(items: NavItem[] = navItems): { label: string; href: string }[] {
  const out: { label: string; href: string }[] = [];
  for (const item of items) {
    if (item.href) out.push({ label: item.label, href: item.href });
    if (item.children) {
      for (const child of item.children) {
        out.push({ label: child.label, href: child.href });
      }
    }
  }
  return out;
}

/** @deprecated Użyj navItems — zachowane dla kompatybilności stopki. */
export const navAnchors = flattenNavItems();

export const footerLinks = [
  { label: "Strona główna", href: "/" },
  { label: "Blog", href: "/artykuly" },
  { label: "Audiobooki", href: "/audiobooki" },
  { label: "Wydarzenia", href: "/wydarzenia" },
  { label: "Oferta", href: "/oferta" },
  { label: "Warsztaty Pro Tools", href: "/warsztaty-pro-tools" },
  { label: "mix/mastering", href: "/mix-mastering" },
  { label: "Numer konta", href: "/numer-konta-bankowego" },
  { label: "Dołącz do nas", href: "/dolacz-do-nas" },
  { label: "Zarząd fundacji", href: "/zarzad-fundacji" },
  { label: "Dokumenty", href: "/dokumenty" },
  { label: "Regulamin sklepu", href: "/regulamin" },
  { label: "Polityka prywatności", href: "/polityka-prywatnosci" },
  { label: "Polityka cookies", href: "/polityka-cookies" },
];

export const homeHeroAssets = {
  heroImage: heroStudio,
  logo: gddLogo,
};

/** Krótki znak pionowy w hero (jak „MANA” na referencji). */
export const heroVerticalMark = "GDD";

export const homeHeroData = {
  heading: "Gospoda Dobrego Dźwięku",
  subtitle: "FUNDACJA ARTYSTYCZNA",
  description:
    "Łączymy pasję do muzyki, edukacji i pięknego dźwięku. Tworzymy przestrzeń, w której młodzi twórcy mogą rozwijać się przy studyjnym i estradowym sprzęcie audio.",
  cta1Label: "Nasza oferta",
  cta1Href: "#cele",
  cta2Label: "Warsztaty i kontakt",
  cta2Href: "#warsztaty",
};

export const homeOfferings = [
  {
    title: "Warsztaty muzyczne",
    location: "Pro Tools · online i stacjonarnie",
    description:
      "Indywidualne i grupowe zajęcia: teoria, praca w DAW, montaż, produkcja muzyczna i materiały audiowizualne.",
    icon: "fa-music",
  },
  {
    title: "Mix / mastering · udźwiękawianie",
    location: "Studio · postprodukcja",
    description:
      "Profesjonalne wykończenie nagrań oraz dźwięk do reklam, filmów, prezentacji i form edukacyjnych.",
    icon: "fa-headphones",
  },
  {
    title: "Fundacja i społeczność",
    location: "Warszawa · online",
    description:
      "Wspieramy warsztaty, projekty artystyczne i rozwój młodych twórców — niezależnie od możliwości finansowych.",
    icon: "fa-users",
  },
];

export const homeTimelineEvents = [
  {
    year: "Misja",
    title: "Fundacja artystyczna",
    description:
      "Powstanie organizacji z misją łączenia edukacji muzycznej, realizacji dźwięku i otwartego dostępu do wiedzy.",
    tag: "START",
  },
  {
    year: "Edukacja",
    title: "Warsztaty i szkolenia",
    description:
      "Zajęcia z realizacji studyjnej i estradowej, pracy w Pro Tools oraz produkcji — dla uczniów, studentów i pasjonatów.",
    tag: "WARSZTATY",
  },
  {
    year: "Projekty",
    title: "Społeczność twórców",
    description:
      "Współpraca z twórcami, materiały edukacyjne i działania, które realnie wspierają rozwój kreatywności.",
    tag: "SPOŁECZNOŚĆ",
  },
  {
    year: "Dziś",
    title: "Kuchnia dźwiękowa",
    description:
      "Miks jak w kuchni — składniki, smak i forma. Zapraszamy do współpracy, warsztatów i odkrywania pięknego dźwięku.",
    tag: "TERAZ",
  },
];

/** 5 „celów”: 3 oferty + 2 pierwsze wpisy osi czasu (wg planu). */
export const homeGoalsFive = [
  ...homeOfferings.map((o) => ({
    kind: "offering" as const,
    title: o.title,
    body: o.description,
    meta: o.location,
    icon: o.icon,
  })),
  ...homeTimelineEvents.slice(0, 2).map((t) => ({
    kind: "timeline" as const,
    title: t.title,
    body: t.description,
    meta: `${t.year} · ${t.tag}`,
    icon: "fa-seedling",
  })),
];

/** Sekcja „Wydarzenia” — pozostałe wpisy osi (od indeksu 2). */
export const homeEventsList = homeTimelineEvents.slice(2);

export const homeGalleryImages = [
  { image: gal01, src: gal01.src, alt: "Instrumenty i studio" },
  { image: gal02, src: gal02.src, alt: "Koncert i muzyka na żywo" },
  { image: gal03, src: gal03.src, alt: "Scena i światła" },
  { image: gal04, src: gal04.src, alt: "Twórczość i nagrania" },
  { image: gal05, src: gal05.src, alt: "Realizacja dźwięku" },
  { image: gal06, src: gal06.src, alt: "Studio i produkcja" },
];
