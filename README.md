# Gospoda Dobrego Dźwięku — Astro + WordPress CMS + sklep Stripe

Strona główna jest budowana w Astro (output **static** + adapter Node dla API), a sekcje **Wydarzenia** i **Artykuły** mogą pobierać treść z lokalnego WordPressa przez REST API. Sklep audiobooków korzysta ze Stripe Checkout, webhooka i automatycznej wysyłki linku pobrania na e-mail.

## Uruchomienie Astro

```bash
pnpm install
copy .env.example .env
pnpm dev
```

Strona: `http://localhost:4321`

## Build i produkcja (static + Node API)

Strony są prerenderowane; endpointy `/api/*` (`prerender = false`) wymagają serwera Node po buildzie.

**Ważne:** samo wgranie folderu `dist/client/` na CDN **nie wystarczy** — webhook Stripe i pobieranie plików wymagają procesu Node (`dist/server/entry.mjs`).

```bash
pnpm run build
pnpm start
```

Domyślnie serwer nasłuchuje na porcie `4321` (zmienne `HOST` / `PORT` zgodnie z adapterem Node).

## Deploy na Hostinger przez GitHub Actions (SSH)

Jeśli Hostinger blokuje uruchamianie binarek podczas instalacji (np. `esbuild`/`sharp`), buduj projekt w GitHub Actions i wgrywaj gotowy output przez SSH.

### Co jest wdrażane

Workflow wysyła **statyczny output** z `dist/client/` do katalogu docelowego (np. `public_html/`).

> Uwaga: endpointy `/api/*` (Stripe webhook, download, resend) wymagają procesu Node. Na shared hostingu zwykle nie zadziałają — do tego potrzebujesz VPS/Node runtime.

### Sekrety w GitHub (Settings → Secrets and variables → Actions)

W repo ustaw:

- `SSH_HOST` (np. `1.2.3.4` albo `twoja-domena.pl`)
- `SSH_PORT` (np. `22`)
- `SSH_USER` (np. `u123456789`)
- `SSH_PATH` (np. `/home/u123456789/domains/gdd.fyntrasoft.com/public_html`)
- `SSH_PRIVATE_KEY` (klucz prywatny do SSH, najlepiej ed25519)
- `PUBLIC_SITE_URL` (np. `https://gdd.fyntrasoft.com`)

Opcjonalnie (tylko jeśli używasz WordPress w prod):

- `WP_API_URL`
- `PUBLIC_WP_SITE_URL`

### Checklist produkcyjny

| Wymaganie | Opis |
|-----------|------|
| `PUBLIC_SITE_URL` | **Obowiązkowe** — docelowa domena HTTPS (canonical, linki w mailu, redirecty Checkout). Nie polegaj na fallbacku z nagłówka `Host`. |
| Proces Node | Uruchom `node ./dist/server/entry.mjs` (skrypt `pnpm start`) lub kontener z całym `dist/`. |
| Wolumen `.data/` | Trwały dysk dla `download-tokens.json` między restartami. |
| Wolumen `private/` | Pliki MP3 audiobooków poza repozytorium. |
| `RESEND_API_KEY` | **Obowiązkowe** — bez klucza webhook zwraca 500 (Stripe ponowi dostawę). |
| Stripe live | Osobny webhook endpoint na produkcji (`checkout.session.completed`). |

Alternatywnie po buildzie (dev/test):

```bash
pnpm preview
```

## Uruchomienie lokalnego WordPressa

1. Upewnij się, że masz plik `.env` (skopiuj z `.env.example`).

2. Uruchom kontenery:

```bash
docker compose up -d
```

3. Panel instalacyjny WordPressa:

```text
http://localhost:8080/wp-admin
```

4. Po instalacji w panelu pojawią się typy treści:

- **Wydarzenia** (`gdd_event`)
- **Artykuły** (`gdd_article`)

Mu-plugin: `wordpress/mu-plugins/gdd-cms.php`

## Dodawanie wydarzeń

W panelu WordPress: **Wydarzenia → Dodaj wydarzenie**.

Uzupełnij tytuł, treść/zajawkę, obraz wyróżniający, **Datę wydarzenia**, **Miejsce**, opcjonalnie **Tekst przycisku**.

REST: `http://localhost:8080/wp-json/wp/v2/gdd_event`

## Dodawanie artykułów

**Artykuły → Dodaj artykuł** — tytuł, treść/zajawkę, obraz wyróżniający.

REST: `http://localhost:8080/wp-json/wp/v2/gdd_article`

## Jak Astro pobiera treści

Zmienna `WP_API_URL` (domyślnie `http://localhost:8080/wp-json`). Kod: `src/lib/wordpress.ts`.

Debug błędów fetch przy buildzie: `WP_DEBUG_FETCH=true`

Bez WordPressa build przechodzi z fallbackami (wydarzenia z `gddHome.ts`, artykuły jako CTA).

Strona główna i listy `/wydarzenia`, `/artykuly` są prerenderowane przy buildzie — po nowych wpisach w WP uruchom ponownie `pnpm run build` (lub `pnpm dev`), aby zaktualizować listy na indexie.

Pojedyncze wpisy `/wydarzenia/{slug}` i `/artykuly/{slug}` pobierają treść **na żądanie** z REST (bez rebuildu po każdym nowym wpisie).

## Sklep audiobooków (Stripe)

### Architektura

1. Użytkownik klika **Kup teraz** na `/audiobooki`.
2. `POST /api/create-checkout-session` tworzy sesję Stripe Checkout.
3. Po płatności Stripe wywołuje `POST /api/stripe-webhook` (weryfikacja podpisu `Stripe-Signature`).
4. Webhook generuje jednorazowy token pobrania i wysyła **wyłącznie na e-mail** link `/api/download/{token}` (bez pobrania na stronie `/sukces`).
5. Pliki audio leżą w `private/audiobooks/` (poza publicznym `dist/`).
6. Ponowna wysyłka: `/pobierz-link` → `POST /api/resend-audiobook-link`.

### Zmienne środowiskowe

Skopiuj `.env.example` → `.env` i uzupełnij:

| Zmienna | Opis |
|---------|------|
| `PUBLIC_SITE_URL` | Publiczny URL serwisu (canonical, linki w mailu) |
| `STRIPE_SECRET_KEY` | Klucz sekretny (`sk_test_…` / `sk_live_…`) |
| `STRIPE_WEBHOOK_SECRET` | Sekret webhooka (`whsec_…`) |
| `STRIPE_PRICE_WPROWADZENIE_DZWIEKU` | Price ID produktu w Stripe Dashboard |
| `RESEND_API_KEY` | Klucz Resend (**wymagany** — bez klucza mail nie wychodzi, webhook zwraca 500) |
| `EMAIL_FROM` | Nadawca (`onboarding@resend.dev` na start; w prod zweryfikowana domena) |
| `DOWNLOAD_TOKEN_TTL_HOURS` | Ważność linku pobrania, jednorazowy (domyślnie 48 h w `.env.example`) |

Katalog produktów: `src/data/audiobooks.ts` — mapowanie `envKey` → Price ID.

### Pliki audio

Umieść MP3 w `private/audiobooks/` zgodnie z `fileName` w `audiobooks.ts`. Przykład: `wprowadzenie-dzwieku.mp3`. Szczegóły: `private/audiobooks/README.md`.

### Checklist lokalny (brak maila)

1. `private/audiobooks/wprowadzenie-dzwieku.mp3` istnieje na dysku.
2. `RESEND_API_KEY=re_…` w `.env` (nie puste).
3. `EMAIL_FROM=onboarding@resend.dev` dopóki nie zweryfikujesz własnej domeny w Resend.
4. W trybie testowym Resend wysyła często tylko na zweryfikowany adres konta.
5. Po płatności w logu dev szukaj `[email:sent]` lub `[email:error]`.

### Test lokalny ze Stripe CLI

1. Zainstaluj [Stripe CLI](https://stripe.com/docs/stripe-cli).
2. W jednym terminalu uruchom Astro: `pnpm dev`.
3. W drugim terminalu przekaż webhooki:

```bash
stripe listen --forward-to localhost:4321/api/stripe-webhook
```

Skopiuj wyświetlony `whsec_…` do `.env` jako `STRIPE_WEBHOOK_SECRET`.

4. W Stripe Dashboard utwórz produkt i cenę; wklej Price ID do `.env`.
5. Wejdź na `/audiobooki`, kup w trybie testowym (karta `4242 4242 4242 4242`).
6. Sprawdź log serwera (mail) lub skrzynkę Resend.

### Produkcja — checklist

1. Przełącz klucze Stripe na **live** (`sk_live_…`).
2. Webhook: `https://twoja-domena.pl/api/stripe-webhook`, zdarzenie `checkout.session.completed`.
3. `PUBLIC_SITE_URL=https://twoja-domena.pl` (linki w mailu).
4. Proces Node: `pnpm build && pnpm start` — samo CDN z `dist/client` **nie obsłuży** webhooka ani `/api/download`.
5. Trwały wolumen `.data/` (tokeny w `download-tokens.json`).
6. Trwały katalog `private/audiobooks/` z plikami MP3 na serwerze.
7. `RESEND_API_KEY` + zweryfikowana domena nadawcy (`EMAIL_FROM`).
8. `DOWNLOAD_TOKEN_TTL_HOURS` według polityki (np. 24–48).

## Design system „mana”

Style: [`src/styles/mana.css`](src/styles/mana.css) (Tailwind v4 + tokeny w [`src/styles/mana/_theme.css`](src/styles/mana/_theme.css)).

### Kiedy którego layoutu używać

| Komponent | Zastosowanie |
|-----------|----------------|
| [`ManaSubpageShell`](src/components/mana/ManaSubpageShell.astro) | Podstrony z kickerem i hero (oferta, mix, sklep, CMS archiwa, dokumenty…) |
| [`ManaLegalShell`](src/components/mana/ManaLegalShell.astro) | Polityki, regulamin — wąska kolumna treści prawnej |
| [`ManaStatusShell`](src/components/mana/ManaStatusShell.astro) | Sukces/anulowanie płatności, 404 — komunikat centrowany |
| [`BaseLayout`](src/layouts/BaseLayout.astro) + sekcje home | Strona główna (hero, cele, wydarzenia, galeria) |

### Klasy treści (wspólne)

- `.mana-kicker`, `.mana-title`, `.mana-prose` — typografia
- `.mana-content-section`, `.mana-content-section__title`, `.mana-content-prose`, `.mana-content-list` — sekcje ofertowe
- `.mana-pill` — badge (data, format)
- `.mana-link` — linki akcentowe w treści
- `.mana-btn-solid`, `.mana-btn-outline-dark` — CTA
- `.mana-card`, `.mana-product-card` — karty (sklep)

### Tokeny kolorów (wybrane)

| Token | Użycie |
|-------|--------|
| `--color-mana-warm` | Tło podstron |
| `--color-mana-body` / `--color-mana-subtle` | Tekst główny / drugorzędny |
| `--color-mana-accent` / `--color-mana-link` | Akcent, linki |
| `--color-mana-surface-support` | Pasek wsparcia na stronie głównej |

Kolory hex poza `_theme.css` należy unikać — używaj tokenów lub klas semantycznych.

### Checklist QA wizualnego

Po zmianach stylów sprawdź w `pnpm dev` (375 / 768 / 1280 px): `/`, `/oferta`, `/mix-mastering`, `/warsztaty-pro-tools`, `/audiobooki`, `/sukces`, `/anulowano`, `/artykuly`, `/wydarzenia`, `/dokumenty`, `/polityka-prywatnosci`, `/regulamin`, `/404`, baner cookies. Tab przez header → treść → footer; widoczny focus.

## Strony prawne i SEO

- `/regulamin`, `/polityka-prywatnosci`, `/polityka-cookies`
- Meta Open Graph, canonical, JSON-LD Organization — `src/layouts/BaseLayout.astro`
- `@astrojs/sitemap` — `sitemap-index.xml` po buildzie
- `public/robots.txt` — wskazuje sitemap
- Obraz OG domyślny — `public/og-default.jpg`
- Strona 404 — `src/pages/404.astro`
- Baner cookies — `src/components/mana/CookieBanner.astro`
- Nagłówki bezpieczeństwa (CSP, HSTS, X-Frame-Options) — `src/middleware.ts`

## Struktura API

| Endpoint | Metoda | Opis |
|----------|--------|------|
| `/api/create-checkout-session` | POST | Tworzy sesję Checkout |
| `/api/stripe-webhook` | POST | Obsługa `checkout.session.completed` |
| `/api/download/[token]` | GET | Jednorazowe pobranie MP3 (link tylko z maila) |
| `/api/resend-audiobook-link` | POST | Ponowna wysyłka linku (e-mail + `session_id`) |
| `/pobierz-link` | GET | Formularz ponownej wysyłki |
