import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";

/**
 * PATCH /api/tasks/update
 * Met à jour une tâche
 */
export async function PATCH(request: Request) {
  // Vérifie que l'utilisateur est authentifié
  const me = await getAuthenticatedUser();
  if (!me) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    // Lecture du body
    const body = await request.json();
    const ticketId = body.ticketId;
    const statusId = body.statusId;
    const assignedToId = body.assignedToId;
    const close = body.close === true;

    if (!ticketId) {
      return NextResponse.json({ error: "ticketId manquant" }, { status: 400 });
    }

    // Vérifie que le ticket existe et est bien une tâche
    const current = await prisma.ticket.findUnique({
      where: { id: Number(ticketId) },
      include: {
        status: true,
      },
    });

    if (!current || current.type !== "task") {
      return NextResponse.json(
        { error: "Demande introuvable" },
        { status: 404 }
      );
    }

    // Préparation des données à mettre à jour
    const data: any = {};
    data.updateDate = new Date();
    data.updatedById = me.id;

    // Gestion de l'assignation
    if (typeof assignedToId === "number") {
      data.assignedToId = assignedToId;
    } else if (assignedToId === null) {
      data.assignedToId = null;
    }

    // Gestion de la clôture
    if (close) {
      data.closedDate = new Date();
    }

    // Changement de statut
    if (typeof statusId === "number") {
      data.statusId = statusId;
    }

    // Mise à jour de la DB
    const updated = await prisma.ticket.update({
      where: { id: Number(ticketId) },
      data: data,
      select: { id: true },
    });

    return NextResponse.json({ success: true, id: updated.id });
  } catch (e) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
