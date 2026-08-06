-- CreateTable
CREATE TABLE "Trip" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Trip_pkey" PRIMARY KEY ("id")
);

-- AlterTable (nullable first, backfilled below, then made required)
ALTER TABLE "Hotel" ADD COLUMN     "tripId" INTEGER;

-- Data backfill: create a default trip for existing hotels and assign them to it
INSERT INTO "Trip" ("name", "updatedAt") VALUES ('Griechenland', CURRENT_TIMESTAMP);
UPDATE "Hotel" SET "tripId" = (SELECT "id" FROM "Trip" WHERE "name" = 'Griechenland' LIMIT 1) WHERE "tripId" IS NULL;

-- AlterTable (now safe to enforce NOT NULL)
ALTER TABLE "Hotel" ALTER COLUMN "tripId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Hotel" ADD CONSTRAINT "Hotel_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;
