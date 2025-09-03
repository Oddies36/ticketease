import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/users/by-location?location=...
 * Récupère la liste des utilisateurs d'une localisation donnée.
 */
export async function GET(req: Request) {
  try {
    // Lecture du paramètre location
    const url = new URL(req.url);
    const locationName = url.searchParams.get("location");
    if (!locationName) {
      return NextResponse.json(
        { error: "Paramètre location manquant" },
        { status: 400 }
      );
    }

    // Vérifie que la localisation existe
    const location = await prisma.location.findUnique({
      where: { name: locationName },
    });
    if (!location) {
      return NextResponse.json(
        { error: "Localisation inconnue" },
        { status: 404 }
      );
    }

    // Sélectionne tous les utilisateurs de cette localisation
    const users = await prisma.user.findMany({
      where: { locationId: location.id },
      select: { id: true, firstName: true, lastName: true },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    });

    // Retourne la liste des utilisateurs
    return NextResponse.json({ users });
  } catch (e) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
