import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/categories?type=...
 * Récupère la liste des catégories pour un type de ticket donné.
 */
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams;
  const typeParam = url.get("type") ?? "";

  try {
    // Recherche des catégories filtrées par type
    const categories = await prisma.category.findMany({
      where: { type: typeParam },
      select: { id: true, label: true },
      orderBy: { label: "asc" },
    });

    // Retourne la liste
    return NextResponse.json({ categories });
  } catch (e) {
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}
