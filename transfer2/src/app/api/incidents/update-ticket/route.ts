import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * PATCH /api/update-ticket
 * Met à jour un ticket (statut, assignation, clôture, SLA).
 */
export async function PATCH(req: Request) {
  try {
    // Lecture et parsing du corps JSON
    const body = await req.json();

    const ticketId = Number(body.ticketId);
    const newStatusId = body.statusId;
    const newAssignedToId =
      body.assignedToId === null || typeof body.assignedToId === "number"
        ? (body.assignedToId as number | null)
        : undefined;
    const close = body.close === true;

    if (!ticketId) {
      return NextResponse.json({ error: "ticketId manquant" }, { status: 400 });
    }

    // Récupère l'état actuel du ticket
    const current = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { sla: true, status: true },
    });

    if (!current) {
      return NextResponse.json(
        { error: "Ticket introuvable" },
        { status: 404 }
      );
    }

    // Identifie les statuts spéciaux
    const openStatus = await prisma.status.findUnique({
      where: { label: "Ouvert" },
    });
    const closedStatus = await prisma.status.findUnique({
      where: { label: "Fermé" },
    });

    // Initialisation des variables
    let updateDate: Date = new Date();
    let statusId: number = current.statusId;
    let assignedToId: number | null = current.assignedToId;
    let closedDate: Date | null = current.closedDate;
    let isBreached: boolean = !!current.isBreached;
    let responseDate: Date | null = current.responseDate;

    // Applique les valeurs envoyées par le client
    if (typeof newStatusId === "number") {
      statusId = newStatusId;
    }
    if (newAssignedToId === null || typeof newAssignedToId === "number") {
      assignedToId = newAssignedToId ?? null;
    }

    // Arrêt du SLA "réponse" dès que le ticket quitte "Ouvert"
    if (openStatus) {
      const wasOpen = current.statusId === openStatus.id;
      const leavesOpen =
        typeof newStatusId === "number" && newStatusId !== openStatus.id;

      if (wasOpen && leavesOpen && current.responseDate) {
        const now = Date.now();
        const deadline = new Date(current.responseDate).getTime();

        if (now > deadline) {
          isBreached = true;
        }

        // Arrête le compteur de SLA réponse
        responseDate = null;
      }
    }

    // Arrêt du SLA "résolution" lors de la clôture
    if (close) {
      const now = new Date();
      closedDate = now;

      // Définit automatiquement le statut à "Fermé" si aucun statut explicite n'est fourni
      if (typeof newStatusId !== "number" && closedStatus) {
        statusId = closedStatus.id;
      }

      // Vérifie si le délai de résolution est dépassé
      if (current.sla && typeof current.sla.resolutionTime === "number") {
        const base = new Date(current.creationDate).getTime();
        const deadline = base + current.sla.resolutionTime * 60 * 1000;
        if (now.getTime() > deadline) {
          isBreached = true;
        }
      }
    }

    // Mise à jour de la DB
    const saved = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        updateDate,
        statusId,
        assignedToId,
        closedDate,
        isBreached,
        responseDate,
      },
    });

    return NextResponse.json({ ticket: saved });
  } catch (e) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
