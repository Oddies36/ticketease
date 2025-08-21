import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const location = request.nextUrl.searchParams.get("location") ?? "";
  try {
    const locations = await prisma.location.findUnique({
      where: { name: location },
      select: { name: true, id: true }
    });
    return NextResponse.json(locations);
  } catch (error) {
    console.error("Erreur lors de la récupération des localisations:", error);
    return NextResponse.json([], { status: 500 });
  }
}
