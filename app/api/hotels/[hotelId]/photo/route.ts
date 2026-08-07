import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ hotelId: string }> }) {
  const { hotelId } = await params;
  const id = Number(hotelId);
  if (!Number.isFinite(id)) {
    return new NextResponse(null, { status: 404 });
  }

  const hotel = await prisma.hotel.findUnique({
    where: { id },
    select: { photo: true, photoType: true },
  });

  if (!hotel?.photo || !hotel.photoType) {
    return new NextResponse(null, { status: 404 });
  }

  return new NextResponse(new Uint8Array(hotel.photo), {
    headers: {
      "Content-Type": hotel.photoType,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
