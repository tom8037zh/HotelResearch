export interface RatingPillProps {
  rating: number | null;
  reviewsCount: number | null;
  scale: 5 | 10;
  /** Link zur Quelle (Google Maps/TripAdvisor/Booking.com) - falls gesetzt, wird die Pille klickbar,
   *  auch wenn `rating` null ist (z.B. TripAdvisor-403-Soft-Fail, URL trotzdem manuell prüfbar). */
  url?: string;
}

function tierClasses(rating: number | null, scale: 5 | 10): string {
  if (rating === null) {
    return "bg-tier-neutral-bg text-tier-neutral";
  }
  if (scale === 10) {
    if (rating >= 9) return "bg-tier-green-bg text-tier-green";
    if (rating >= 8) return "bg-tier-blue-bg text-tier-blue";
    if (rating >= 6) return "bg-tier-amber-bg text-tier-amber";
    return "bg-tier-red-bg text-tier-red";
  }
  if (rating >= 4.5) return "bg-tier-green-bg text-tier-green";
  if (rating >= 4.0) return "bg-tier-blue-bg text-tier-blue";
  if (rating >= 3.0) return "bg-tier-amber-bg text-tier-amber";
  return "bg-tier-red-bg text-tier-red";
}

/** Rating-Badge wie im Redesign: gefärbte Pille nach Bewertungs-Tier, s. README "Design Tokens". */
export function RatingPill({ rating, reviewsCount, scale, url }: RatingPillProps) {
  const text =
    rating === null
      ? "Kein Rating"
      : scale === 10
        ? `${rating}/10 (${reviewsCount ?? 0})`
        : `★ ${rating} (${reviewsCount ?? 0})`;

  const className = `inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${tierClasses(rating, scale)}`;

  if (url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className={`${className} hover:opacity-80`}
      >
        {text}
      </a>
    );
  }

  return <span className={className}>{text}</span>;
}
