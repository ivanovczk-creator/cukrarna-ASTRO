# Platby (Comgate) a synchronizace objednávek do POHODY

## Tok dat

```
Košík (ReservationForm.tsx)
  │  1) POST formuláře "objednavka" → Netlify Forms (objednávka je uložena vždy)
  │     → dál ji zpracovává Google Workspace / Google Apps Script (mimo tento repozitář)
  │
  │  2) jen při volbě "Online":
  ▼
netlify/functions/create-payment.mjs  ──▶ Comgate /v1.0/create ──▶ přesměrování zákazníka na bránu
                                                                      │
                          /dekujeme?platba=zaplaceno|zrusena|cekajici ◀┘  (návratová stránka pro zákazníka)
```

Napojení na Make.com bylo odstraněno (funkce `submission-created` a `comgate-callback`, knihovna `make.mjs`).
Platební brána už proto neposílá push notifikace do tohoto projektu – stav plateb sledujte v Comgate Klientském portálu.
Ceny se **vždy přepočítají na serveru** z `data.json` (`netlify/lib/catalog.mjs`); cena z prohlížeče se k platbě nepoužije.
Položky v košíku se proto musí jmenovat stejně jako `title` v `data.json` a mít cenu ve tvaru `"35 Kč"`.

## Přehled proměnných prostředí (checklist pro ostrý provoz)

Zadávají se v **Netlify → Site configuration → Environment variables** (vzor v `.env.example`; `.env` se necommituje).
Po změně proměnných spusťte nový deploy (`PUBLIC_*` se vkládá při buildu, ostatní čtou funkce při běhu).

| Proměnná | Povinná | Kde se používá | Odkud hodnotu vzít / poznámka |
|---|---|---|---|
| `PUBLIC_ONLINE_PAYMENTS` | ano pro online platby | web (build) | `true` zapne volbu „Online kartou“. **Viditelná v prohlížeči** – nedávat sem tajné údaje. |
| `COMGATE_MERCHANT` | ano pro online platby | `create-payment` | ID e-shopu z Comgate Klientského portálu (Připojení obchodů). |
| `COMGATE_SECRET` | ano pro online platby | `create-payment` | Heslo pro API u stejného propojení obchodu. **Tajné.** |
| `COMGATE_TEST` | ne (výchozí `true`) | `create-payment` | `false` až po schválení ostrého provozu Comgatem. |
| `POHODA_ICO` | ano pro POHODU | generátor XML (`netlify/lib/pohoda.mjs`) | IČO účetní jednotky. Bez něj se použije zástupné `00000000`. |
| `POHODA_RATE_VAT` | ne (výchozí `low`) | generátor XML | `none` / `low` / `high` / `third` – ověřte s účetní. |
| `POHODA_MSERVER_URL` | jen při přímém odeslání | `integrations/pohoda/send-to-pohoda.mjs` | Adresa mServeru, např. `http://host:444/xml`. Musí být dostupný zvenčí (VPN / reverzní proxy). |
| `POHODA_USER`, `POHODA_PASSWORD` | jen při přímém odeslání | `send-to-pohoda.mjs` | Uživatel POHODY s právem pro mServer. **Tajné.** |
| `POHODA_CHECK_DUPLICITY` | ne (výchozí zapnuto) | `send-to-pohoda.mjs` | `false` vypne kontrolu duplicity čísla objednávky. |

Poznámky:
- `POHODA_MSERVER_URL`, `POHODA_USER` a `POHODA_PASSWORD` **Netlify funkce nepoužívají** – čte je jen skript `send-to-pohoda.mjs`.
- Tajné hodnoty (`COMGATE_SECRET`, `POHODA_PASSWORD`) v Netlify označte jako *Secret* a omezte na scope *Functions*.
- Výchozí stav bez jakékoli proměnné: web funguje, objednávky se ukládají v Netlify Forms, online platba je vypnutá.
## 1. Zapnutí online plateb (Comgate)

1. V Comgate Klientském portálu vytvořte propojení obchodu, zapište **ID e-shopu** a **heslo pro API**.
2. V Netlify nastavte proměnné z `.env.example` (`COMGATE_MERCHANT`, `COMGATE_SECRET`, `COMGATE_TEST=true`).
3. V propojení obchodu v Comgate nastavte URL:
   - zaplaceno: `https://cukrarstviblahutovi.cz/dekujeme?platba=zaplaceno&refId=${refId}`
   - zrušeno / chyba: `https://cukrarstviblahutovi.cz/dekujeme?platba=zrusena&refId=${refId}`
4. Nastavte `PUBLIC_ONLINE_PAYMENTS=true` a přebuildujte web (proměnná se vkládá při buildu).
5. Vyzkoušejte v testovacím režimu, až potom `COMGATE_TEST=false` (vyžaduje schválení ze strany Comgate).

Dokud je `PUBLIC_ONLINE_PAYMENTS` vypnutá, formulář nabízí jen platbu při převzetí.

## 2. POHODA

- `netlify/lib/pohoda.mjs` generuje mXML **přijaté objednávky** (`receivedOrder`), číslo objednávky = `orderId`; používá ho skript `send-to-pohoda.mjs`.
- Nastavte `POHODA_ICO` a `POHODA_RATE_VAT` (`low`/`high`…; ověřte správnou sazbu s účetní).
- V POHODĚ musí běžet **mServer** (Soubor → Datová komunikace → POHODA mServer) s přístupem pro API uživatele.
- Lokální vyzkoušení bez POHODY:

```bash
node integrations/pohoda/send-to-pohoda.mjs integrations/pohoda/sample-order.json
node integrations/pohoda/send-to-pohoda.mjs integrations/pohoda/sample-order.json --out objednavka.xml   # k ručnímu importu
```

> Jde o vzorovou implementaci – před ostrým provozem ji ověřte na zkušební účetní jednotce
> (struktura mXML se může lišit podle verze POHODY a nastavení číselných řad).

## Soubory k jedlému tisku (formulář `tisk-na-papir`)

Přílohy Netlify Forms se v e-mailu zobrazují jako odkazy za přihlášením (CloudFront), proto se **nenahrávají přes Netlify Forms**:

1. `EdiblePrintForm.tsx` ověří výběr (JPG, PNG, WEBP, HEIC, PDF; max. 5 souborů, každý do 5 MB; příliš velké JPG/PNG/WEBP se v prohlížeči zmenší na A4 @ 300 dpi).
2. Každý soubor se nahraje na `POST /api/upload-print` (`netlify/functions/upload-print.mjs`) do **Netlify Blobs**; server znovu ověří příponu, velikost a obsah souboru.
3. Do formuláře se pole `Tisk-Odkazy` vyplní veřejnými odkazy `https://cukrarstviblahutovi.cz/tisk-soubory/<uuid>/<soubor>`, které vyřizuje `netlify/functions/print-file.mjs`. Odkaz se po kliknutí rovnou stáhne, není potřeba přihlášení; `<uuid>` je náhodné a neuhodnutelné.
4. Odkazy jsou v e-mailovém upozornění Netlify Forms v poli **Tisk-Odkazy**.

Stejný mechanismus používá formulář **dort na přání** (`CustomCakeForm.tsx`): jeden nepovinný inspirační obrázek, odkaz v e-mailu je v poli **Foto-Odkaz**.

Nutné: `@netlify/blobs` (už v `package.json`), žádné další proměnné prostředí – Blobs se na Netlify konfigurují automaticky.
Nahrávání nefunguje v `astro dev` / `astro preview` (chybí funkce) – formulář v tom případě zobrazí srozumitelnou hlášku. Pro lokální test použijte `netlify dev`.
Soubory se automaticky mažou po 90 dnech (naplánovaná funkce `netlify/functions/cleanup-print-files.mjs`, GDPR).

## Lokální testování funkcí

```bash
npm i -g netlify-cli
netlify dev     # spustí web + funkce na http://localhost:8888
```
