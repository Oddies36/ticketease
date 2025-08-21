import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";

/**
 * GET /api/incidents/myinc
 * Incidents créés par l'utilisateur authentifié.
 * Réponse: { tickets: Array<...> }
 */
export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const tickets = await prisma.ticket.findMany({
      where: { type: "incident", createdById: user.id },
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
