# Projekt-Kontext: HotelResearch

Diese Datei fasst den aktuellen Stand des Projekts zusammen, damit eine neue Claude-Code-Session
sich schnell zurechtfindet. Detaillierte Historie inkl. Entscheidungsbegründungen steht in
`C:\Users\thoma\.claude\plans\parallel-kindling-metcalfe.md` (lokal, nicht Teil des Repos).

## Was die App macht

Interne Webseite zur Verwaltung von Hotels pro Reise. Man legt eine **Reise** an, erfasst darunter
**Hotels** (Name, Link zu Google Maps/TripAdvisor/Booking.com, Bemerkungen), und die App holt beim
Anlegen/Bearbeiten automatisch die aktuelle **Bewertung** (Sterne + Anzahl) von jeder verlinkten
Quelle via Apify-Scraper. Die Reise-Detailseite zeigt die Hotels als Liste plus eine Karte mit
Standort-Markern.

## Tech-Stack

- **Next.js 16** (App Router, Turbopack, React 19) — Next.js 16 hat einige Breaking Changes ggü.
  älteren Versionen (siehe `node_modules/next/dist/docs/` bei Unsicherheit, insbesondere
  `01-app/02-guides/upgrading/version-16.md`). Wichtig u.a.: async `params`/`searchParams`,
  `ssr: false` bei `next/dynamic` nur in Client Components erlaubt.
- **Prisma 7** + **PostgreSQL** (gehostet auf Railway). Prisma 7 nutzt einen Driver-Adapter
  (`@prisma/adapter-pg`) statt der klassischen `DATABASE_URL`-only-Verbindung im Client, siehe
  `lib/prisma.ts`. Generierter Client liegt unter `app/generated/prisma` (gitignored, wird via
  `postinstall`-Script neu erzeugt).
- **Apify** als Scraping-Anbieter für alle drei Bewertungsquellen (Details unten).
- **Leaflet + react-leaflet** für die Karte (OpenStreetMap-Kacheln, kein API-Key nötig).
- **Tailwind CSS**, Server Actions (`"use server"`) statt klassischer REST-API-Routen für Mutationen.
- Gehostet auf **Railway**, Deploy passiert automatisch bei Push auf `main` von
  [github.com/tom8037zh/HotelResearch](https://github.com/tom8037zh/HotelResearch).

## Datenmodell (`prisma/schema.prisma`)

```
Trip (id, name, startDate?, endDate?, coverPhoto?, coverPhotoType?, createdAt, updatedAt)
  └─ Hotel[] (id, tripId, name, notes, latitude, longitude, photo?, photoType?,
              photoSource?: UPLOAD|GOOGLE, createdAt, updatedAt)
       └─ Rating[] (id, hotelId, source: GOOGLE|TRIPADVISOR|BOOKING, url, rating, reviewsCount, updatedAt)
```

- `Rating` ist pro Hotel + Quelle eindeutig (`@@unique([hotelId, source])`), damit sich weitere
  Quellen später anfügen lassen, ohne das Schema erneut umzubauen.
- Cascade-Delete durchgängig: Reise löschen → Hotels weg → Ratings weg.
- `latitude`/`longitude` kommen kostenlos aus der Google-Maps-Apify-Antwort mit (`location.lat/lng`
  im Response), kein zusätzlicher Aufruf nötig. TripAdvisor/Booking liefern keine Koordinaten für
  uns (nicht gebraucht, da Google-Link Pflichtfeld ist und jedes Hotel abdeckt).
- `startDate`/`endDate` sind optional (`@db.Date`, kein Zeitanteil) — entweder beide gesetzt oder
  beide leer (serverseitig validiert in `app/trips/actions.ts`). Karte zeigt bei fehlendem Zeitraum
  einfach keine Datumszeile.
- Fotos (`coverPhoto`/`photo`, jeweils `Bytes` + `*Type`-Mime-String) liegen direkt in Postgres, kein
  externer Storage-Dienst — bewusste Entscheidung, um keine weitere Abhängigkeit (S3 o.ä.) einzuführen;
  serverseitig auf 4 MB/Bild + `jpeg`/`png`/`webp` begrenzt (`lib/upload.ts`). Ausgeliefert über eigene
  Routen `app/api/trips/[tripId]/photo` und `app/api/hotels/[hotelId]/photo`. Beim Lesen von Listen wird
  bewusst nur der `*Type`-String selektiert (nie die Bytes), um nicht versehentlich alle Fotos auf jeder
  Listenansicht zu übertragen — siehe `app/page.tsx`/`app/trips/[tripId]/page.tsx`.
- `Hotel.photoSource` unterscheidet, ob das Foto hochgeladen wurde oder automatisch von Google Maps
  übernommen wurde (`imageUrl`-Feld aus derselben Apify-Antwort wie das Rating, siehe unten) — steuert,
  wann beim Bearbeiten ein neuer Download versucht wird.

## Apify-Integration (`lib/apify.ts`)

| Quelle | Actor | Pflicht? | Kosten/Abfrage | Besonderheit |
|---|---|---|---|---|
| Google Maps | `compass/google-maps-reviews-scraper` | ja | ~$0.001 | `maxReviews: 1`, liefert `location.lat/lng` und `imageUrl` (Hauptfoto des Orts) mit |
| TripAdvisor | `maxcopell/tripadvisor` | optional | ~$0.003 | **Wird gelegentlich von TripAdvisor per HTTP 403 geblockt** (Anti-Bot). Kein Code-Fehler — Soft-Fail greift, Hotel wird trotzdem gespeichert, Rating bleibt leer. Manchmal klappt's, manchmal nicht (Proxy-abhängig). |
| Booking.com | `voyager/booking-scraper` | optional | ~$0.005 | Bewertet auf **10er-Skala** (nicht 5 Sterne!) — UI zeigt "X/10" statt "★". Die günstigere `voyager/fast-booking-scraper`-Variante geht NICHT für Einzel-Hotel-URLs (nur Ziel-Suche). |

Alle drei Fetch-Funktionen (`fetchGoogleMapsRating`, `fetchTripAdvisorRating`,
`fetchBookingRating`) geben bei jedem Fehler `null` zurück statt zu werfen — bewusstes
Soft-Fail-Prinzip: Hotel wird immer gespeichert, fehlende Ratings können durch erneutes Speichern
nachgeholt werden. Beim Anlegen/Bearbeiten werden alle geänderten Quellen **parallel** abgerufen
(`Promise.all`), nicht nacheinander.

`isGoogleMapsUrl`/`isTripAdvisorUrl`/`isBookingUrl` validieren Links per Hostname-Check (inkl.
Kurzlinks wie `maps.app.goo.gl`).

## Environment-Variablen

Liegen lokal in `.env` (DB) und `.env.local` (Apify) — beide gitignored, nie im Chat weitergeben.

- `DATABASE_URL` — Postgres-Connection-String. Lokal die **öffentliche** Railway-URL
  (`DATABASE_PUBLIC_URL` im Railway-Dashboard), da die private nur innerhalb von Railways Netzwerk
  erreichbar ist. Auf Railway selbst per Referenzvariable `${{Postgres.DATABASE_URL}}` verlinkt.
- `APIFY_API_TOKEN` — Apify-API-Token (eigener Account des Nutzers).

## Deployment-Besonderheiten (Railway)

- `package.json`: `"start": "prisma migrate deploy && next start"` — wendet bei jedem Deploy
  automatisch neue Migrationen an.
- `"postinstall": "prisma generate"` — nötig, da der generierte Client nicht im Git-Repo liegt.
- Homepage und Reise-Seiten haben `export const dynamic = "force-dynamic"` — ohne das versucht
  Next.js, sie beim Build statisch vorzurendern, was fehlschlägt, weil der Build-Container keinen
  Zugriff auf `postgres.railway.internal` hat (nur der laufende Deploy ist im privaten Netzwerk).

## UI/Design

Helles Admin-Dashboard-Design (Rating-Badges, sortierbare Hoteltabelle, Karten-Pin-Highlighting,
Foto-Slots) — Design-Referenzen lagen als statische HTML-Prototypen in
`design/design_handoff_hotel_research_redesign/` (README dort beschreibt Vorgaben im Detail,
`.dc.html`-Dateien selbst nicht 1:1 übernommen, sondern in Tailwind-Klassen umgesetzt). Design-Tokens
(Farben, Radien) liegen als `--color-*`-Variablen in `app/globals.css` (`@theme`-Block), z.B. `bg-page`,
`text-text-secondary`, `bg-tier-green-bg`. Die vier Screens sind bewusst **rein hell** (kein `dark:`)
umgesetzt, kein Dark-Mode mehr auf diesen Seiten. Icons (Pencil/Trash/Chevron/Foto-Platzhalter) liegen
als eigene SVG-Komponenten in `app/components/icons.tsx`.

## Bekannte Einschränkungen / offene Punkte

- TripAdvisor-Scraping ist unzuverlässig (siehe Tabelle oben) — akzeptiertes Risiko, kein Fix geplant.
- Keine Authentifizierung/Nutzerverwaltung (bewusst, internes Tool für einen Nutzer).
- Trip-Titelbild ist Upload-only (kein Google-Bezug), da eine Reise keinen eigenen Maps-Link hat.

## Git-Historie (Kurzfassung, siehe `git log` für Details)

1. Demo: einzelnen Google-Maps-Link abfragen (zunächst Outscraper, dann auf Apify gewechselt)
2. Hotel-CRUD mit Postgres/Prisma auf Railway
3. TripAdvisor als zweite Bewertungsquelle (→ Schema-Umbau auf `Rating`-Tabelle pro Quelle)
4. Booking.com als dritte Quelle
5. Reisen (`Trip`) als übergeordnete Struktur eingeführt, Hotels gruppiert
6. Karte mit Hotel-Markern auf der Reise-Seite
7. Redesign (helles Admin-Dashboard-Layout, sortierbare Tabelle, Karten-Pin-Highlighting)
8. Datumsbereich für Reisen + Foto-Upload (Trip-Titelbild, Hotel-Foto wahlweise Upload oder automatisch
   von Google Maps)
