import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/cmdb/get-computer?id=...
 * Retourne un ordinateur par son identifiant
 */
export async function GET(req: Request) {
  try {
    // Récupère et analyse l'URL
    const url = new URL(req.url);
    const idParam = url.searchParams.get("id");

    // Vérifie la présence du paramètre
    if (!idParam) {
      return NextResponse.json({ error: "id manquant" }, { status: 400 });
    }

    // Vérifie que l'id est bien un nombre
    const id = Number(idParam);
    if (isNaN(id)) {
      return NextResponse.json({ error: "id invalide" }, { status: 400 });
    }

    // Recherche dans la DB
    const computer = await prisma.computer.findUnique({
      where: { id: id },
      include: {
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (!computer) {
      return NextResponse.json(
        { error: "Ordinateur introuvable" },
        { status: 404 }
      );
    }

    return NextResponse.json({ computer });
  } catch (e) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
