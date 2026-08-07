# Handoff: HotelResearch Redesign

## Overview
Visual redesign of 4 screens in the HotelResearch app (tom8037zh/HotelResearch, Next.js 16 + Tailwind + Prisma): the trips overview, the trip detail hotel table, and the "new trip" / "new hotel" forms. Replaces the original plain black/white Tailwind styling with a light admin-dashboard look (rating badges, sortable table, map pin highlighting, per-item photo slots).

## About the Design Files
The files in this bundle are **design references created in HTML** (static prototypes with inline styles) — not production code to copy directly. Recreate these designs inside the existing Next.js 16 App Router codebase, using **Tailwind CSS** (already the project's styling approach) and existing patterns: Server Components for data fetching, Server Actions (`"use server"`) for mutations, `useActionState` for forms (see current `HotelForm.tsx` / `TripForm.tsx`), and `react-leaflet` for the map (see `HotelsMap.tsx`). Convert every inline `style="..."` in the HTML to Tailwind utility classes; don't inline raw CSS in the real app.

## Fidelity
**High-fidelity.** Colors, spacing, typography, and component structure below are final — implement pixel-accurately with the codebase's existing Tailwind setup.

## Screens

### 1. Trips Overview — `Trips Overview Redesign.dc.html`
Maps to: `app/page.tsx`
- **Purpose**: List all trips, create a new one, open/edit/delete a trip.
- **Layout**: Page bg `#f4f4f5`, content `max-width: 1240px` centered, `padding: 40px 32px`. Header row: `<h1>Reisen</h1>` (24px/600) left, "+ Neue Reise" black button right. Below: CSS grid of trip cards, `grid-template-columns: repeat(auto-fill, minmax(300px, 1fr))`, `gap: 16px`.
- **Trip card**: white bg, `border: 1px solid #e4e4e7`, `border-radius: 14px`, overflow hidden.
  - Top: a **photo slot**, full card width, 130px tall (in the real app: an optional trip cover image; if none, show a neutral placeholder fill, not a broken image).
  - Body padding `16px 20px 20px`: trip name (15px/600, truncated with ellipsis), date range label below it (12px, `#a1a1aa`) — e.g. "12.–19. Juli 2026" (same-month) or "22. Mai – 2. Jun 2026" (cross-month). **Note**: the current schema has no date-range field on `Trip` — this needs a schema addition (e.g. `startDate`/`endDate` on `Trip`) or should be dropped if out of scope.
  - Hotel-count pill: rounded-full badge, 12px/500, padding `4px 10px`. Color tiers: 0 hotels → bg `#f4f4f5` / text `#71717a`; 1–4 → bg `#eff6ff` / text `#2563eb`; 5+ → bg `#ecfdf5` / text `#059669`. Label "Keine Hotels" / "1 Hotel" / "N Hotels".
  - Footer row (border-top `1px solid #f0f0f1`, `padding-top: 14px`, `margin-top: 18px`): "Ansehen" (13px/500, `#18181b`, with a small right-chevron SVG icon, no underline) on the left; edit-pencil and delete-trash icon buttons (15px SVGs, pencil stroke `#52525b`, trash stroke `#dc2626`) on the right.
- **Interactions**: card click (except icons) → navigate to `/trips/[id]`. Pencil → `/trips/[id]/edit`. Trash → confirm dialog then `deleteTrip` action (existing pattern in `ConfirmDeleteButton.tsx`).

### 2. Trip Detail — Hotel Table — `Hotel Table Redesign.dc.html`
Maps to: `app/trips/[tripId]/page.tsx`, `app/trips/HotelsMap.tsx`
- **Purpose**: show all hotels for a trip as a sortable table with ratings, plus a map of hotel locations; clicking a hotel row highlights its map pin.
- **Layout**: same page shell (`#f4f4f5` bg, `max-width: 1240px`). Back link "← Alle Reisen". Header row: trip name (h1) + hotel count subtitle, "+ Neues Hotel" button right.
- **Table** (built as a CSS grid of rows, not a real `<table>`, to avoid the browser's table content-model foster-parenting issues with server-rendered/mapped rows — a real `<table>`+`.map()` is fine in React/JSX, this constraint was specific to the prototyping tool): white card, `border: 1px solid #e4e4e7`, `border-radius: 14px`, `box-shadow: 0 1px 2px rgba(0,0,0,0.03)`, horizontally scrollable, `min-width: 920px`.
  - Grid columns: `1.6fr 1.1fr 1.1fr 1.1fr 1.4fr 110px` → Hotel | Google | TripAdvisor | Booking.com | Notizen | Aktionen.
  - Header row: bg `#fafafa`, 14px/500 `#71717a`, `padding: 14px 12px`. Hotel / Google / TripAdvisor / Booking.com headers are clickable to sort (click again reverses direction); an ▲/▼ glyph (10px, `#a1a1aa`) shows the active sort column + direction. Sort logic: Hotel = alphabetical (`localeCompare`); rating columns = numeric, hotels with `rating === null` always sort to the bottom regardless of direction.
  - Row: `padding: 16px 12px` per cell, border-top `1px solid #f0f0f1`, all rows white (no zebra striping), row is clickable (see map interaction below).
    - **Hotel cell**: 72×72px rounded (`border-radius: 10px`) photo slot + hotel name (500 weight). Photo is a per-hotel cover image the user can attach; falls back to a neutral placeholder, not an initial-letter avatar (tried and rejected — illegible at avatar sizes).
    - **Rating cells** (Google / TripAdvisor / Booking.com): a rounded-full pill, 12px/500, `padding: 4px 10px`. Google & TripAdvisor are 5-star scale, text `★ {rating} ({reviewCount})`; Booking.com is a 10-point scale, text `{rating}/10 ({reviewCount})`. Missing rating → pill text "Kein Rating", bg `#f4f4f5` / color `#71717a` (this also covers the known TripAdvisor 403/soft-fail case from `lib/apify.ts`). Color tiers by score:
      - 5-scale: ≥4.5 → `#ecfdf5`/`#059669`; ≥4.0 → `#eff6ff`/`#2563eb`; ≥3.0 → `#fff7ed`/`#d97706`; else → `#fef2f2`/`#dc2626`.
      - 10-scale: ≥9 → `#ecfdf5`/`#059669`; ≥8 → `#eff6ff`/`#2563eb`; ≥6 → `#fff7ed`/`#d97706`; else → `#fef2f2`/`#dc2626`.
    - **Notizen cell**: `#71717a`, single line, `text-overflow: ellipsis`, "—" if empty.
    - **Aktionen cell**: right-aligned, two icon buttons only — edit pencil (16px SVG, stroke `#52525b`) and delete trash (16px SVG, stroke `#dc2626`). No overflow/"more" menu.
- **Map section** below the table: white card, `border-radius: 14px`, `padding: 16px`, label "Standorte" (13px/500 `#71717a`). Map area 220px tall, light dot-grid background (`radial-gradient(#d4d4d8 1px, transparent 1px)`, `16px 16px`), `overflow: hidden`. Each hotel is a pin (custom teardrop SVG, solid `#18181b` fill with a white inner circle, 22×28px, `drop-shadow` filter) anchored at the bottom tip, with a small white name-label pill (`border: 1px solid #e4e4e7`, `border-radius: 6px`, 11px/500) above it. In the real app this is `react-leaflet` markers with a custom `Icon` (replace the current default Leaflet pin icon with this same teardrop SVG rendered to a data URL/PNG), positioned by real `latitude`/`longitude` — the prototype uses fake percentage-based `x/y` positions since it has no map tiles.
- **Row ↔ map interaction**: clicking a table row selects that hotel (click again to deselect). When a hotel is selected: its map label gets a black background/white text (instead of white bg/black text); all *other* pins' opacity drops to `0.4`; the selected pin's `z-index` rises above the rest. No pin scaling/resizing and no ring/halo effect — both were tried and explicitly rejected as too visually busy. Selecting a row also sets that row's own background to `#f0f0f1` (light gray, not blue — blue was tried and rejected).

### 3. New Trip form — `New Trip Form Redesign.dc.html`
Maps to: `app/trips/new/page.tsx`, `app/trips/TripForm.tsx`
- Same page shell, `max-width: 520px`. Back link "← Zurück", h1 "Neue Reise".
- White card, `border: 1px solid #e4e4e7`, `border-radius: 14px`, `padding: 28px`.
- One field: label "Reise" (13px/500) above a text input (`padding: 10px 12px`, `border: 1px solid #e4e4e7`, `border-radius: 8px`, 14px), placeholder "z.B. Sommerurlaub Griechenland 2026".
- Full-width black submit button ("Speichern"), `border-radius: 8px`, `padding: 11px 18px`, 14px/500, white text.
- Preserve existing behavior: `useActionState` + Server Action, inline error message (red, `bg-red-50`/`text-red-700` equivalents) shown above the button on failure, button shows a pending-state label while submitting.

### 4. New Hotel form — `New Hotel Form Redesign.dc.html`
Maps to: `app/trips/[tripId]/hotels/new/page.tsx`, `app/hotels/HotelForm.tsx`
- Same shell as the Trip form, `max-width: 520px`. Back link "← Zurück zu {trip name}", h1 "Neues Hotel".
- Same white card treatment. Fields, all styled like the Trip form's input:
  1. "Hotel" (required, text)
  2. "Link zu Google Maps" (required, url)
  3. "Link zu TripAdvisor" — label carries a `(optional)` suffix in `#a1a1aa`, 400 weight
  4. "Link zu Booking.com" — same `(optional)` suffix
  5. "Bemerkungen" — `<textarea>`, 4 rows, `resize: vertical`
- Full-width black submit button "Speichern". Preserve the existing pending-state copy ("Rating wird abgerufen, das kann etwas dauern…") and the inline error banner from the current `HotelForm.tsx`.

## Interactions & Behavior (cross-cutting)
- No hover/focus states were explicitly designed beyond: inputs get a `border-color: #a1a1aa` on focus (no default browser outline).
- No transitions/animations except an opacity fade on map pins (`transition: opacity .15s`) when selection changes.
- No loading/skeleton states designed — keep the existing `isPending` button-label pattern from the current forms.
- Not designed for mobile/responsive — the table has horizontal scroll as its only small-screen accommodation; ask before extending further.

## State Management
- Hotel table: `sortColumn` ('name' | 'google' | 'tripadvisor' | 'booking'), `sortDesc` (boolean), `selectedHotelId` (number | null, for the row↔map highlight).
- No other client state beyond standard form state (`useActionState`).

## Design Tokens
- **Backgrounds**: page `#f4f4f5`; card `#fff`; card border `#e4e4e7`; table header bg `#fafafa`; row divider `#f0f0f1`; map background `#f0f0f1` with `#d4d4d8` dot pattern; selected-row bg `#f0f0f1`.
- **Text**: primary `#18181b`; secondary `#71717a`; tertiary/muted `#a1a1aa`.
- **Semantic (rating tiers)**: green bg `#ecfdf5` / text `#059669`; blue bg `#eff6ff` / text `#2563eb`; amber bg `#fff7ed` / text `#d97706`; red bg `#fef2f2` / text `#dc2626`; neutral bg `#f4f4f5` / text `#71717a`.
- **Radius**: cards/tables 14px; buttons/inputs 8px; badges/pills 999px (full); photo slots 10px.
- **Typography**: system font stack (`-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif` in the prototype — swap for the app's existing font, e.g. Geist, from `layout.tsx`). Sizes used: 24px/600 (h1), 15–16px/500–600 (names), 14px (body/inputs), 13px (labels/secondary), 12px (badges/date labels), 11px (map labels), 10px (sort arrows).
- **Spacing**: page padding `40px 32px`; card padding `20–28px`; table cell padding `16px 12px`; form field gap `20px`.

## Assets
- Hotel photo slots and trip cover photo slots are placeholders — no real images were supplied. Wire them to actual image upload/storage (or leave as a styled empty state) as a follow-up.
- Icons are hand-drawn inline SVGs (edit pencil, delete trash, chevron, map pin) — copy the exact paths from the HTML files in this bundle rather than substituting an icon library's version, to keep the look consistent.

## Files
- `Trips Overview Redesign.dc.html`
- `Hotel Table Redesign.dc.html`
- `New Trip Form Redesign.dc.html`
- `New Hotel Form Redesign.dc.html`

Each opens directly in a browser to preview. View source for the exact markup/inline styles referenced above.
