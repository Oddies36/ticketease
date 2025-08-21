import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 *   Renvoyer les tâches approuvées pour une localisation donnée.
 *
 * Paramètres url:
 *   - location: string - nom exact de la localisation
 *
 * Retour:
 *   - 200: { tasks: Array<{ id, number, title, creationDate, status, priority, assignmentGroup, assignedTo }> }
 *   - 400: { error } si le paramètre 'location' est manquant
 *   - 404: { error } si la localisation n’existe pas
 *   - 500: { error } en cas d’erreur serveur
 */
export async function GET(req: NextRequest) {
  // Récupération des paramètres dans l'url
  const searchParams = req.nextUrl.searchParams;
  const locationName = searchParams.get("location");

  // Validation du paramètre location qui est requis
  if (!locationName) {
    return NextResponse.json(
      { error: "Paramètre 'location' manquant" },
      { status: 400 }
    );
  }

  try {
    // Recherche de la localisation par son nom
    const loc = await prisma.location.findUnique({
      where: { name: locationName },
      select: { id: true },
    });

    if (!loc) {
      return NextResponse.json(
        { error: "Localisation inconnue" },
        { status: 404 }
      );
    }

    // Récupération des tâches approuvées pour cette localisation
    const tasks = await prisma.ticket.findMany({
      where: {
        type: "task",
        locationId: loc.id,
        isApproved: true,
      },
      orderBy: { creationDate: "desc" },
      select: {
        id: true,
        number: true,
        title: true,
        creationDate: true,
        status: { select: { label: true } },
        priority: { select: { label: true } },
        assignmentGroup: { select: { groupName: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return NextResponse.json({ tasks }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
