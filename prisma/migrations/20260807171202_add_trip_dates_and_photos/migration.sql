-- CreateEnum
CREATE TYPE "HotelPhotoSource" AS ENUM ('UPLOAD', 'GOOGLE');

-- AlterTable
ALTER TABLE "Hotel" ADD COLUMN     "photo" BYTEA,
ADD COLUMN     "photoSource" "HotelPhotoSource",
ADD COLUMN     "photoType" TEXT;

-- AlterTable
ALTER TABLE "Trip" ADD COLUMN     "coverPhoto" BYTEA,
ADD COLUMN     "coverPhotoType" TEXT,
ADD COLUMN     "endDate" DATE,
ADD COLUMN     "startDate" DATE;
