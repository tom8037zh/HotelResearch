/*
  Warnings:

  - You are about to drop the column `googleMapsUrl` on the `Hotel` table. All the data in the column will be lost.
  - You are about to drop the column `rating` on the `Hotel` table. All the data in the column will be lost.
  - You are about to drop the column `reviewsCount` on the `Hotel` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "ReviewSource" AS ENUM ('GOOGLE', 'TRIPADVISOR');

-- AlterTable
ALTER TABLE "Hotel" DROP COLUMN "googleMapsUrl",
DROP COLUMN "rating",
DROP COLUMN "reviewsCount";

-- CreateTable
CREATE TABLE "Rating" (
    "id" SERIAL NOT NULL,
    "hotelId" INTEGER NOT NULL,
    "source" "ReviewSource" NOT NULL,
    "url" TEXT NOT NULL,
    "rating" DOUBLE PRECISION,
    "reviewsCount" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rating_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Rating_hotelId_source_key" ON "Rating"("hotelId", "source");

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "Hotel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
