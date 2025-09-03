import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Récupère toutes les localisations (seul le champ "name")
    // triées par ordre alphabétique
    const groups = await prisma.location.findMany({
      select: { name: true },
      orderBy: { name: "asc" },
    });

    // Retourne la liste en JSON
    return NextResponse.json(groups);
  } catch (error) {
    // Retourne un tableau vide avec un statut HTTP 500
    return NextResponse.json([], { status: 500 });
  }
}
