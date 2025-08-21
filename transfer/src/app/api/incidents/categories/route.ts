import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 *   Renvoie la liste des catégories, triées par label en ASC.
 *
 * Paramètres URL:
 *   - Le type de ticket.
 *
 * Retour:
 *   - 200: { categories: Array<{ id: number; label: string }> }
 *   - 500: { error: string } en cas d’erreur
 */
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams;
  const typeParam = url.get("type") ?? "";

  try {
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