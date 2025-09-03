import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/incidents/priorities
 * Retourne la liste des priorités disponibles, triées par id croissant.
 */
export async function GET() {
  try {
    // Récupère toutes les priorités, triées par id
    const priorities = await prisma.priority.findMany({
      select: { id: true, label: true },
      orderBy: { id: "asc" },
    });
    return NextResponse.json({ priorities });
  } catch (e) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
