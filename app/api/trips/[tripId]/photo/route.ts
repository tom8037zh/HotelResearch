import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  const id = Number(tripId);
  if (!Number.isFinite(id)) {
    return new NextResponse(null, { status: 404 });
  }

  const trip = await prisma.trip.findUnique({
    where: { id },
    select: { coverPhoto: true, coverPhotoType: true },
  });

  if (!trip?.coverPhoto || !trip.coverPhotoType) {
    return new NextResponse(null, { status: 404 });
  }

  return new NextResponse(new Uint8Array(trip.coverPhoto), {
    headers: {
      "Content-Type": trip.coverPhotoType,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
