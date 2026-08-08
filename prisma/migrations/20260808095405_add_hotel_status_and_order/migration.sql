-- CreateEnum
CREATE TYPE "HotelStatus" AS ENUM ('PRIORITIZED', 'BOOKED', 'DISCARDED');

-- AlterTable (default 0 first, backfilled below with existing creation order per trip)
ALTER TABLE "Hotel" ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "status" "HotelStatus";

-- Data backfill: give existing hotels a stable per-trip order matching their previous creation order
WITH ranked AS (
  SELECT "id", ROW_NUMBER() OVER (PARTITION BY "tripId" ORDER BY "createdAt") - 1 AS "rn"
  FROM "Hotel"
)
UPDATE "Hotel" SET "sortOrder" = "ranked"."rn"
FROM ranked
WHERE "Hotel"."id" = "ranked"."id";
