# Pliki audiobooków (poza repozytorium)

Umieść tutaj pliki MP3 sprzedawane w sklepie. **Bez pliku fulfillment zwróci błąd i mail nie zostanie wysłany.**

Nazwy muszą odpowiadać polu `fileName` w `src/data/audiobooks.ts`.

## Wymagany plik (obecny katalog produktów)

| Plik | Produkt |
|------|---------|
| `wprowadzenie-dzwieku.mp3` | Wprowadzenie do pięknego dźwięku |

## Lokalny test

1. Skopiuj MP3 do tego folderu.
2. Ustaw w `.env`: `RESEND_API_KEY`, `EMAIL_FROM=onboarding@resend.dev` (lub zweryfikowaną domenę).
3. `pnpm dev` → zakup testowy → sprawdź log `[email:sent]` lub skrzynkę.
