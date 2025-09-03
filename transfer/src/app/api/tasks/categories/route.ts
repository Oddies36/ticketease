import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/tasks/categories?type=...
 * Renvoie la liste des catégories filtrées par type,
 * triées par label en ordre croissant.
 */
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams;
  const typeParam = url.get("type") ?? "";

  try {
    // Recherche les categories
    const categories = await prisma.category.findMany({
      where: { type: typeParam },
      select: { id: true, label: true },
      orderBy: { label: "asc" },
    });

    return NextResponse.json({ categories });
  } catch (e) {
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}
