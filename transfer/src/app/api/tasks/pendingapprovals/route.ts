import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";

/**
 *   Renvoyer les tâches en attente d'approbation pour l'utilisateur connecté.
 *
 * Paramètres url:
 *   - Aucun
 *
 * Retour:
 *   - 200: { tasks: Array<{ id, number, title, creationDate, createdBy: { firstName, lastName } }> }
 *   - 401: { error } si l'utilisateur n'est pas authentifié
 *   - 500: { error } en cas d'erreur serveur
 */
export async function GET() {
  // Vérifie l'utilisateur connecté
  const currentUser = await getAuthenticatedUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    // Récupère les tâches non approuvées dont l'approverId est l'utilisateur courant.
    const tasks = await prisma.ticket.findMany({
      where: {
        type: "task",
        isApproved: false,
        approverId: currentUser.id,
      },
      orderBy: { creationDate: "desc" },
      select: {
        id: true,
        number: true,
        title: true,
        creationDate: true,
        createdBy: { select: { firstName: true, lastName: true } },
      },
    });

    return NextResponse.json({ tasks }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
