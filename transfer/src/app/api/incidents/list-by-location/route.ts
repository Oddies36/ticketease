import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Récupère la liste des incidents pour une localisation donnée, avec option
 * de filtrage sur les incidents en dépassement de SLA.
 *
 * Paramètres url :
 * - location : string - nom exact de la localisation
 * - breached : boolean - si présent, ne renvoie que les tickets isBreached = true
 *
 * Retour :
 * - 200 : { tickets: Array<> } - incidents triés par date de création DESC
 * - 400 : { error: string } - paramètre manquant ou invalide
 * - 404 : { error: string } - localisation inconnue
 * - 500 : { error: string } - erreur serveur
 */
export async function GET(req: NextRequest) {
  // Lecture des paramètres de requête
  const searchParams = req.nextUrl.searchParams;
  const location = searchParams.get("location");
  const breached = searchParams.get("breached");

  // Validation : la localisation est obligatoire
  if (!location) {
    return NextResponse.json(
      { error: "Paramètre 'location' manquant" },
      { status: 400 }
    );
  }

  try {
    // Récupère l'ID de la localisation à partir de son nom
    const loc = await prisma.location.findUnique({
      where: { name: location },
      select: { id: true },
    });

    if (!loc) {
      return NextResponse.json(
        { error: "Localisation inconnue" },
        { status: 404 }
      );
    }

    // Construction du filtre principal. Utilisé principalement pour y ajouter isBreached quand nécessaire
    const where: any = {
      type: "incident",
      locationId: loc.id,
    };

    // Filtre optionnel : uniquement les incidents en dépassement SLA
    if (breached === "1" || breached === "true") {
      where.isBreached = true;
    }

    // Lecture des incidents avec les champs nécessaires pour l'affichage
    const tickets = await prisma.ticket.findMany({
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
      },
    });

    return NextResponse.json({ tickets });
  } catch (_) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
