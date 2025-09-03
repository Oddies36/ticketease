import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/incidents/statuses
 * Retourne la liste des statuts disponibles, triées par id croissant.
 */
export async function GET() {
  try {
    // Récupère tout les statuts, triées par id
    const statuses = await prisma.status.findMany({
      select: { id: true, label: true },
      orderBy: { id: "asc" },
    });
    return NextResponse.json({ statuses });
  } catch (e) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
