import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const groups = await prisma.location.findMany({
      select: { name: true },
      orderBy: { name: "asc" }
    });
    return NextResponse.json(groups);
  } catch (error) {
    console.error("Erreur lors de la récupération des groupes:", error);
    return NextResponse.json([], { status: 500 });
  }
}
