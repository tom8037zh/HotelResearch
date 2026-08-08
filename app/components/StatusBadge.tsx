export type HotelStatusValue = "PRIORITIZED" | "BOOKED" | "DISCARDED";

const STATUS_LABELS: Record<HotelStatusValue, string> = {
  PRIORITIZED: "Priorisiert",
  BOOKED: "Gebucht",
  DISCARDED: "Verworfen",
};

const STATUS_CLASSES: Record<HotelStatusValue, string> = {
  PRIORITIZED: "bg-tier-blue-bg text-tier-blue",
  BOOKED: "bg-tier-green-bg text-tier-green",
  DISCARDED: "bg-tier-red-bg text-tier-red",
};

/** Status-Badge (Priorisiert/Gebucht/Verworfen), nutzt dieselben Tier-Farbtokens wie RatingPill. */
export function StatusBadge({ status }: { status: HotelStatusValue | null }) {
  if (!status) return null;

  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_CLASSES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
