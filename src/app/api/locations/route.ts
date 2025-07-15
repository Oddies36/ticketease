import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const locations = await prisma.location.findMany({
      select: { name: true, id: true },
      orderBy: { name: "asc" }
    });
    return NextResponse.json(locations);
  } catch (error) {
    console.error("Erreur lors de la récupération des localisations:", error);
    return NextResponse.json([], { status: 500 });
  }
}
