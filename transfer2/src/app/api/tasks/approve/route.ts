import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";

/**
 * PATCH /api/tasks/approve
 * Permet au manager d'approuver ou refuser une tâche.
 */
export async function PATCH(req: Request) {
  const me = await getAuthenticatedUser();
  if (!me) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const ticketId = Number(body.ticketId);
    const approve = Boolean(body.approve);
    const managerNote = body.comment ? String(body.comment) : "";

    // Vérification des paramètres
    if (!ticketId) {
      return NextResponse.json({ error: "ticketId manquant" }, { status: 400 });
    }

    // Vérifie que le ticket existe et est une tâche
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: {
        id: true,
        type: true,
        approverId: true,
        isApproved: true,
      },
    });

    if (!ticket || ticket.type !== "task") {
      return NextResponse.json(
        { error: "Demande introuvable" },
        { status: 404 }
      );
    }

    // Vérifie que l'appelant est bien le manager de validation
    if (ticket.approverId !== me.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const now = new Date();

    if (approve) {
      // Approbation
      await prisma.ticket.update({
        where: { id: ticketId },
        data: {
          isApproved: true,
          updateDate: now,
          updatedById: me.id,
          additionalInfo:
            managerNote && managerNote.length > 0 ? managerNote : undefined,
        },
      });

      return NextResponse.json({ success: true });
    } else {
      // Refus => on ferme la demande
      const closed = await prisma.status.findFirst({
        where: {
          OR: [
            { label: "Fermé" },
            { label: "Clôturé" },
            { label: "Ferme" },
            { label: "Cloture" },
          ],
        },
        select: { id: true },
      });

      const dataToSave: any = {
        isApproved: false,
        updateDate: now,
        updatedById: me.id,
      };

      if (closed && closed.id) {
        dataToSave.statusId = closed.id;
        dataToSave.closedDate = now;
        dataToSave.closedById = me.id;
      }

      if (managerNote && managerNote.length > 0) {
        dataToSave.additionalInfo = managerNote;
      } else {
        dataToSave.additionalInfo = "Demande refusée par le manager.";
      }

      await prisma.ticket.update({
        where: { id: ticketId },
        data: dataToSave,
      });

      return NextResponse.json({ success: true });
    }
  } catch (e) {
    console.error("approve error:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
