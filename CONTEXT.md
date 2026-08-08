# Projekt-Kontext: HotelResearch

Diese Datei fasst den aktuellen Stand des Projekts zusammen, damit eine neue Claude-Code-Session
sich schnell zurechtfindet. Detaillierte Historie inkl. Entscheidungsbegründungen steht in
`C:\Users\thoma\.claude\plans\parallel-kindling-metcalfe.md` und
`C:\Users\thoma\.claude\plans\lies-design-design-handoff-hotel-researc-robust-rainbow.md`
(lokal, nicht Teil des Repos).

## Was die App macht

Interne Webseite zur Verwaltung von Hotels pro Reise. Man legt eine **Reise** an (Name, optional
Datumsbereich, optional Titelbild), erfasst darunter **Hotels** (Name, Website, Link zu Google
Maps/TripAdvisor/Booking.com, Bemerkungen, Status, Foto), und die App holt beim Anlegen/Bearbeiten
automatisch die aktuelle **Bewertung** (Sterne + Anzahl) von jeder verlinkten Quelle via
Apify-Scraper. Die Reise-Detailseite zeigt die Hotels als sortierbare Tabelle (Desktop) bzw.
Karten-Liste (Mobile, < 768px) plus eine Karte mit Standort-Markern; Hotels lassen sich per
Drag-and-Drop in eine persönliche Reihenfolge bringen.

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
- **@dnd-kit/core + sortable + utilities** für die per Drag-and-Drop editierbare Hotel-Reihenfolge
  (funktioniert einheitlich mit Maus und Touch).
- **Tailwind CSS**, Server Actions (`"use server"`) statt klassischer REST-API-Routen für Mutationen.
- Gehostet auf **Railway**, Deploy passiert automatisch bei Push auf `main` von
  [github.com/tom8037zh/HotelResearch](https://github.com/tom8037zh/HotelResearch).

## Datenmodell (`prisma/schema.prisma`)

```
Trip (id, name, startDate?, endDate?, coverPhoto?, coverPhotoType?, createdAt, updatedAt)
  └─ Hotel[] (id, tripId, name, website?, notes, latitude, longitude, photo?, photoType?,
              photoSource?: UPLOAD|GOOGLE, status?: PRIORITIZED|BOOKED|DISCARDED, sortOrder,
              createdAt, updatedAt)
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
  Routen `app/api/trips/[tripId]/photo` und `app/api/hotels/[hotelId]/photo`, mit `?v=<updatedAt>`-
  Cache-Buster in allen `<img>`-Quellen (sonst zeigt der Browser bis zu 1h das alte Bild nach einem
  Foto-Wechsel, wegen `Cache-Control: max-age=3600`). Beim Lesen von Listen wird bewusst nur der
  `*Type`-String selektiert (nie die Bytes), um nicht versehentlich alle Fotos auf jeder Listenansicht
  zu übertragen.
- `Hotel.photoSource` unterscheidet, ob das Foto hochgeladen wurde oder automatisch von Google Maps
  übernommen wurde (`imageUrl`-Feld aus derselben Apify-Antwort wie das Rating, siehe unten) — steuert,
  wann beim Bearbeiten ein neuer Download versucht wird.
- `Hotel.website` (optional) — eigene Hotel-Website, unabhängig von den drei Bewertungsquellen; der
  Hotelname in Tabelle/Karte verlinkt dorthin, wenn gesetzt.
- `Hotel.status` (optional Enum `PRIORITIZED|BOOKED|DISCARDED`) — freier Planungsstatus, als farbiges
  Badge angezeigt (`app/components/StatusBadge.tsx`).
- `Hotel.sortOrder` (Int, nicht nullable) — manuelle, per Drag-and-Drop editierbare Reihenfolge
  innerhalb einer Reise. Neue Hotels werden ans Ende angehängt (`aggregate max(sortOrder)+1` in
  `createHotel`). Wird über die eigene Server Action `reorderHotels(tripId, orderedIds)` geschrieben
  (direkter Funktionsaufruf aus einer Client-Komponente, kein `<form>`).

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
Kurzlinks wie `maps.app.goo.gl`). Rating-Pills in der Tabelle sind Links zur jeweiligen Quelle (auch
im "Kein Rating"-Fall, z.B. nach TripAdvisor-403 — Nutzer kann die URL trotzdem manuell öffnen).

Apify-Guthaben checken: `GET https://api.apify.com/v2/users/me/limits` mit `Authorization: Bearer
$APIFY_API_TOKEN` (Token aus `.env.local`, nie im Chat ausgeben) — liefert `limits.maxMonthlyUsageUsd`
vs. `current.monthlyUsageUsd` für den laufenden Abrechnungszyklus. Nutzer möchte das **nicht**
automatisiert/geplant, sondern nur bei Nachfrage live geprüft haben (Cloud-Routinen hätten ohnehin
keinen Zugriff auf den lokalen Token).

## Environment-Variablen

Liegen lokal in `.env` (DB) und `.env.local` (Apify) — beide gitignored, nie im Chat weitergeben.

- `DATABASE_URL` — Postgres-Connection-String. Lokal die **öffentliche** Railway-URL
  (`DATABASE_PUBLIC_URL` im Railway-Dashboard), da die private nur innerhalb von Railways Netzwerk
  erreichbar ist. Auf Railway selbst per Referenzvariable `${{Postgres.DATABASE_URL}}` verlinkt.
  **Wichtig:** das ist dieselbe physische Datenbank wie Production — lokale `prisma migrate dev`-Läufe
  wirken sich direkt auf Railway aus (siehe Gotcha unten).
- `APIFY_API_TOKEN` — Apify-API-Token (eigener Account des Nutzers).

## Deployment-Besonderheiten (Railway)

- `package.json`: `"start": "prisma migrate deploy && next start"` — wendet bei jedem Deploy
  automatisch neue Migrationen an.
- `"postinstall": "prisma generate"` — nötig, da der generierte Client nicht im Git-Repo liegt.
- Homepage und Reise-Seiten haben `export const dynamic = "force-dynamic"` — ohne das versucht
  Next.js, sie beim Build statisch vorzurendern, was fehlschlägt, weil der Build-Container keinen
  Zugriff auf `postgres.railway.internal` hat (nur der laufende Deploy ist im privaten Netzwerk).

### ⚠️ Gotcha: hängender lokaler `prisma migrate dev` blockiert Railway-Deploy

Lokale Entwicklung und Railway nutzen **dieselbe** Postgres-DB. `prisma migrate dev` hält während der
Ausführung einen Postgres-Advisory-Lock. Falls der Befehl lokal an einem interaktiven Prompt hängen
bleibt (z.B. "Enter a name for the new migration" bei unklarer Diff-Erkennung) und der Prozess nicht
sauber beendet wird, bleibt dieser Lock offen — Railways `prisma migrate deploy` beim Container-Start
kann ihn dann nicht bekommen, läuft nach 10s in `Error P1002` und crash-loopt. **Fix:** hängende
`node`-Prozesse mit `prisma migrate dev` in der Command-Line finden (PowerShell:
`Get-CimInstance Win32_Process -Filter "name = 'node.exe'" | Where CommandLine -match prisma`) und
beenden, dann `SELECT * FROM pg_locks WHERE locktype='advisory'` prüfen ob leer. Vorbeugung: nach jedem
`prisma migrate dev`-Aufruf verifizieren, dass der Prozess wirklich durchgelaufen und beendet ist,
bevor man weiterarbeitet oder pusht.

### ⚠️ Gotcha: Dev-Server cached alten Prisma-Client

Nach `prisma migrate dev`/`prisma generate` liefert der bereits laufende `next dev`-Prozess (Turbopack)
weiterhin den alten generierten Client aus (`PrismaClientValidationError: Unknown argument ...`) bis
er komplett neu gestartet wird — ein einfaches Reload im Browser reicht nicht. Immer den Dev-Server
stoppen und neu starten nach Schema-Änderungen.

## UI/Design

Helles Admin-Dashboard-Design (Rating-Badges, sortierbare Hoteltabelle, Karten-Pin-Highlighting,
Foto-Slots) — Design-Referenzen lagen als statische HTML-Prototypen in
`design/design_handoff_hotel_research_redesign/` (README dort beschreibt Vorgaben im Detail,
`.dc.html`-Dateien selbst nicht 1:1 übernommen, sondern in Tailwind-Klassen umgesetzt). Design-Tokens
(Farben, Radien) liegen als `--color-*`-Variablen in `app/globals.css` (`@theme`-Block), z.B. `bg-page`,
`text-text-secondary`, `bg-tier-green-bg`. Alle Screens sind bewusst **rein hell** (kein `dark:`)
umgesetzt, kein Dark-Mode mehr. Icons (Pencil/Trash/Chevron/Foto-Platzhalter/Grip) liegen als eigene
SVG-Komponenten in `app/components/icons.tsx`. Favicon (`app/icon.svg`) nutzt denselben Karten-Pin wie
die Standort-Marker.

**Mobile (< 768px, Tailwind `md:`-Breakpoint):** `app/trips/HotelsTable.tsx` rendert zwei Pfade im
selben Component-Tree (`md:hidden` / `hidden md:block`), geteilter State — keine separate Mobile-Seite.
Unterhalb `md` wird die Tabelle durch eine Karten-Liste ersetzt (`HotelCard.tsx`), Spalten-Sortierung
durch ein `<select>`-Dropdown. Reine Formular-Seiten waren schon vorher schmal genug.

**Hotel-Reihenfolge:** `HotelsTable.tsx` hat einen "Reihenfolge"-Sortier-Modus (Default), in dem Zeilen/
Karten per `@dnd-kit` draggable sind (Grip-Handle links). Bei jedem anderen Sortier-Modus sind die
Griffe sichtbar aber deaktiviert/gedimmt. **Wichtig:** beide `<DndContext>`-Instanzen (Mobile+Desktop,
nur eine sichtbar per CSS) brauchen eine explizite, stabile `id`-Prop — sonst generiert dnd-kit interne
Accessibility-IDs über einen modul-globalen Zähler, der zwischen Server- und Client-Render nicht
übereinstimmt (React-Hydration-Mismatch).

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
9. Layout-Polish (Karten-Card-Header, breitere Notizen-Spalte, Trennlinie), Rating-Pills als Links,
   Hotel-Website-Feld, resizable Karten-Panel (natives CSS `resize`)
10. Mobile-Ansicht für die Hoteltabelle (Karten-Liste unter 768px)
11. Eigenes Favicon (Karten-Pin-Motiv) + Seitentitel
12. Manuelle Hotel-Reihenfolge per Drag-and-Drop (`@dnd-kit`) + Status-Feld (Priorisiert/Gebucht/
    Verworfen)
