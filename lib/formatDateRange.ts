const MONTHS_DE = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];

/**
 * Formatiert einen Reise-Datumsbereich fürs Trip-Karten-Label, 1:1 aus der Design-Referenz
 * ("Trips Overview Redesign.dc.html") übernommen: gleicher Monat -> "12.–19. Juli 2026",
 * monatsübergreifend -> "22. Mai – 2. Jun 2026". Gibt null zurück, wenn kein vollständiger
 * Bereich vorliegt (Karte zeigt dann einfach keine Datumszeile).
 */
export function formatDateRange(start: Date | null, end: Date | null): string | null {
  if (!start || !end) return null;

  const sameMonth = start.getUTCMonth() === end.getUTCMonth() && start.getUTCFullYear() === end.getUTCFullYear();
  const startDay = start.getUTCDate();
  const endDay = end.getUTCDate();
  const endPart = `${endDay}. ${MONTHS_DE[end.getUTCMonth()]} ${end.getUTCFullYear()}`;

  if (sameMonth) return `${startDay}.–${endPart}`;
  return `${startDay}. ${MONTHS_DE[start.getUTCMonth()]} – ${endPart}`;
}
