import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Renvoyer les tâches approuvées pour une localisation donnée, avec option
 * de filtrage sur les tâches en dépassement de SLA.
 *
 * Paramètres url:
 *   - location: string - nom exact de la localisation
 *   - breached: boolean - si présent, ne renvoie que les tâches isBreached = true
 *
 * Retour:
 *   - 200: { tasks: Array<> }
 *   - 400: { error } si le paramètre 'location' est manquant
 *   - 404: { error } si la localisation n'existe pas
 *   - 500: { error } en cas d'erreur serveur
 */
export async function GET(req: NextRequest) {
  // Récupération des paramètres dans l'url
  const searchParams = req.nextUrl.searchParams;
  const locationName = searchParams.get("location");
  const breached = searchParams.get("breached");

  // Validation du paramètre location qui est requis.
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

    // Construction du filtre
    const where: any = {
      type: "task",
      locationId: loc.id,
      isApproved: true,
    };

    // Si paramètre breached fourni → filtrer uniquement les tâches en retard
    if (breached === "1" || breached === "true") {
      where.isBreached = true;
    }

    // Récupération des tâches
    const tasks = await prisma.ticket.findMany({
      where,
      orderBy: { creationDate: "desc" },
      select: {
        id: true,
        number: true,
        title: true,
        creationDate: true,
        closedDate: true,
        responseDate: true,
        status: { select: { label: true } },
        priority: { select: { label: true } },
        assignmentGroup: { select: { groupName: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
        sla: { select: { responseTime: true, resolutionTime: true } },
        isBreached: true,
      },
    });

    return NextResponse.json({ tasks }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
