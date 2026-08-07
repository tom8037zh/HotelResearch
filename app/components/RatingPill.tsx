export interface RatingPillProps {
  rating: number | null;
  reviewsCount: number | null;
  scale: 5 | 10;
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
export function RatingPill({ rating, reviewsCount, scale }: RatingPillProps) {
  const text =
    rating === null
      ? "Kein Rating"
      : scale === 10
        ? `${rating}/10 (${reviewsCount ?? 0})`
        : `★ ${rating} (${reviewsCount ?? 0})`;

  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${tierClasses(rating, scale)}`}
    >
      {text}
    </span>
  );
}
