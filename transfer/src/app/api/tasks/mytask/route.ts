import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";

/**
 * GET /api/tasks/mytask
 * Récupère toutes les tâches créées par l'utilisateur authentifié.
 */
export async function GET() {
  // Vérifie l'utilisateur connecté
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    // Récupère les tâches de type "task" créées par l'utilisateur
    const tickets = await prisma.ticket.findMany({
      where: { type: "task", createdById: user.id },
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
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
        sla: { select: { responseTime: true, resolutionTime: true } },
      },
    });

    return NextResponse.json({ tickets });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
